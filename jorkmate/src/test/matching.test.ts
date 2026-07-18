import { describe, expect, it } from 'vitest'
import { matchScore } from '../utils/matching'
import { JOBS, getJob } from '../data/jobs'
import { PERSONAS } from '../data/personas'

const ari = PERSONAS[0].profile

describe('matchScore', () => {
  it('is deterministic for the same profile and job', () => {
    const job = getJob('job-boogle')!
    expect(matchScore(ari, job)).toBe(matchScore(ari, job))
  })

  it('scores a strong category/location/skill match above a mismatch', () => {
    const boogle = getJob('job-boogle')! // SG internship, Ari's wheelhouse
    const whiterock = getJob('job-whiterock')! // HK banking, none of Ari's skills
    expect(matchScore(ari, boogle)).toBeGreaterThan(matchScore(ari, whiterock))
  })

  it('stays within the displayed 8–98 range for all seeded pairs', () => {
    for (const persona of PERSONAS) {
      for (const job of JOBS) {
        const s = matchScore(persona.profile, job)
        expect(s).toBeGreaterThanOrEqual(8)
        expect(s).toBeLessThanOrEqual(98)
      }
    }
  })

  it('ships exactly ten seeded jobs', () => {
    expect(JOBS).toHaveLength(10)
  })
})
