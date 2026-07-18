import type { Job, UserProfile } from '../types'

/**
 * Deterministic match score, five weighted factors:
 * category 30 · location 20 · work mode 15 · employment type 12 · skills 23.
 * Raw 0–100 is remapped to 8–98 so real matches read like dating-app percentages.
 */
export function matchScore(profile: UserProfile, job: Job): number {
  const p = profile.preferences
  let raw = 0

  if (job.categories.some((c) => p.industries.includes(c))) raw += 30
  if (p.locations.includes(job.city)) raw += 20
  if (p.workModes.includes(job.workMode)) raw += 15
  if (p.employmentTypes.includes(job.employmentType)) raw += 12

  const mine = new Set([...profile.skills, ...profile.tools].map((s) => s.toLowerCase()))
  const hits = job.skills.filter((s) => mine.has(s.toLowerCase())).length
  raw += job.skills.length ? (23 * hits) / job.skills.length : 0

  return Math.min(98, Math.round(8 + raw * 0.9))
}

export function sortedDeck(profile: UserProfile, jobs: Job[], boostJobId: string | null): Job[] {
  const sorted = [...jobs].sort((a, b) => matchScore(profile, b) - matchScore(profile, a))
  if (!boostJobId) return sorted
  const boosted = sorted.find((j) => j.id === boostJobId)
  return boosted ? [boosted, ...sorted.filter((j) => j.id !== boostJobId)] : sorted
}
