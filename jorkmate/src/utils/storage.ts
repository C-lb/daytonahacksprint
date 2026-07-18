/** Versioned localStorage helpers. All persistence goes through here. */

export const KEYS = {
  session: 'jorkmate:v1:session',
  profile: 'jorkmate:v1:profile',
  applications: 'jorkmate:v1:applications',
  skippedJobs: 'jorkmate:v1:skippedJobs',
  settings: 'jorkmate:v1:settings',
  onboardingDraft: 'jorkmate:v1:onboardingDraft',
} as const

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = JSON.parse(raw)
    if (parsed === null || typeof parsed !== typeof fallback) return fallback
    if (Array.isArray(fallback) !== Array.isArray(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable — demo keeps running in memory */
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function clearAll(): void {
  Object.values(KEYS).forEach(remove)
}
