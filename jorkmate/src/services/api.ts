import type { Job, LiveApplication } from '../types'

/**
 * Thin client for the team server (src/server.mjs, port 3000 — proxied as /api
 * in dev, same-origin when the built app is served from web/). Every call is
 * fail-soft: the frontend falls back to seeded jobs + the local agent
 * simulator whenever the server is absent, per the design-spec rule that the
 * demo never depends on live pieces succeeding.
 */

const TIMEOUT = 2500

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path, { signal: AbortSignal.timeout(TIMEOUT) })
  if (!r.ok) throw new Error(`${path} → ${r.status}`)
  return r.json() as Promise<T>
}

export async function detectServer(): Promise<boolean> {
  try {
    await get('/api/profile')
    return true
  } catch {
    return false
  }
}

interface ServerJob {
  id: string
  company: string
  title: string
  location: string | null
  salary: string | null
  url: string
  industry: string | null
  description: string | null
  match: { score: number; blurb: string } | null
}

const CITY_COUNTRY: Record<string, string> = {
  Singapore: 'Singapore',
  'Hong Kong': 'Hong Kong',
  London: 'United Kingdom',
  'New York': 'United States',
}

const PALETTE: [string, string][] = [
  ['#4f7cf0', '#7fd1c9'],
  ['#d94f30', '#f0a04f'],
  ['#2f7a6b', '#8fd0b8'],
  ['#635bff', '#9c8cff'],
  ['#26323f', '#5d7590'],
  ['#0f3057', '#e5573f'],
]
const PATTERNS = ['dots', 'grid', 'waves', 'rings', 'diagonal'] as const

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function toJob(j: ServerJob): Job {
  const [city = '', ...rest] = (j.location ?? '').split(',').map((s) => s.trim())
  const [from, to] = PALETTE[hash(j.company) % PALETTE.length]
  return {
    id: j.id,
    company: j.company,
    title: j.title,
    city: city || 'See listing',
    country: rest.join(', ') || CITY_COUNTRY[city] || '',
    categories: j.industry ? [j.industry] : [],
    sector: /fintech|e-?commerce|finance|bank/i.test(j.industry ?? '') ? 'finance' : 'tech',
    salaryText: j.salary ?? undefined,
    summary: j.description ?? '',
    url: j.url,
    match: j.match ?? null,
    source: 'live',
    brand: {
      initials: j.company.slice(0, 2),
      from,
      to,
      pattern: PATTERNS[hash(j.company) % PATTERNS.length],
    },
  }
}

export async function fetchDeck(): Promise<Job[]> {
  const jobs = await get<ServerJob[]>('/api/deck')
  return jobs.map(toJob)
}

export async function fetchApplications(): Promise<LiveApplication[]> {
  return get<LiveApplication[]>('/api/applications')
}

export async function swipe(jobId: string, direction: 'left' | 'right'): Promise<void> {
  const r = await fetch('/api/swipe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, direction }),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  if (!r.ok) throw new Error(`swipe → ${r.status}`)
}

export interface ParsedResume {
  summary?: string
  work_history?: {
    company?: string
    title?: string
    location?: string
    start?: string
    end?: string
    highlights?: string[]
  }[]
  education?: { school?: string; degree?: string; start?: string; end?: string; notes?: string }[]
  skills?: string[] | Record<string, string[]>
}

/** Kimi resume parse via the team server. Caller falls back to simulated parse on error. */
export async function parseResume(text: string): Promise<ParsedResume> {
  const r = await fetch('/api/profile/resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(45_000), // Kimi is a heavy reasoner
  })
  if (!r.ok) throw new Error(`resume parse → ${r.status}`)
  const data = await r.json()
  return (data.profile ?? data) as ParsedResume
}

export function flattenSkills(skills: ParsedResume['skills']): string[] {
  if (!skills) return []
  if (Array.isArray(skills)) return skills.filter((s) => typeof s === 'string')
  return Object.values(skills)
    .flat()
    .filter((s) => typeof s === 'string')
}
