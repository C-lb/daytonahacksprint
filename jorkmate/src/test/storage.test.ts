import { beforeEach, describe, expect, it } from 'vitest'
import { KEYS, clearAll, load, save } from '../utils/storage'

describe('storage hydration', () => {
  beforeEach(() => localStorage.clear())

  it('returns the fallback for missing keys', () => {
    expect(load(KEYS.applications, [])).toEqual([])
    expect(load<null>(KEYS.session, null)).toBeNull()
  })

  it('safely handles malformed JSON', () => {
    localStorage.setItem(KEYS.applications, '{not json!!')
    expect(load(KEYS.applications, [])).toEqual([])
  })

  it('rejects type-mismatched values', () => {
    localStorage.setItem(KEYS.applications, JSON.stringify({ sneaky: 'object' }))
    expect(load(KEYS.applications, [])).toEqual([])
    localStorage.setItem(KEYS.settings, JSON.stringify('a string'))
    expect(load(KEYS.settings, { agentCounter: 2048, boostJobId: null })).toEqual({
      agentCounter: 2048,
      boostJobId: null,
    })
  })

  it('round-trips values and clears everything on demo reset', () => {
    save(KEYS.skippedJobs, ['job-boogle'])
    expect(load(KEYS.skippedJobs, [])).toEqual(['job-boogle'])
    clearAll()
    expect(load(KEYS.skippedJobs, [])).toEqual([])
  })
})
