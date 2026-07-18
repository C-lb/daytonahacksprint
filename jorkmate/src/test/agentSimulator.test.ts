import { describe, expect, it } from 'vitest'
import {
  STAGES,
  STAGE_OFFSETS,
  TOTAL_DURATION,
  deriveAgentState,
  missingSensitiveAnswer,
  resumedApplication,
} from '../services/agentSimulator'
import { generateApplicationPackage } from '../services/applicationPackage'
import { getJob } from '../data/jobs'
import { PERSONAS, emptyProfile } from '../data/personas'
import type { Application } from '../types'

const ari = PERSONAS.find((p) => p.id === 'persona-ari')!.profile
const boogle = getJob('job-boogle')!

function makeApp(startedAt: number, extraAnswers: Record<string, string> = {}): Application {
  return {
    id: 'app-1',
    jobId: boogle.id,
    profileId: ari.id,
    agentId: 'JM-2048',
    createdAt: startedAt,
    startedAt,
    extraAnswers,
    pkg: generateApplicationPackage(ari, boogle),
    clearedFromActivity: false,
  }
}

describe('agent state machine', () => {
  it('reaches "Submitted · Demo mode" once the run duration elapses', () => {
    const app = makeApp(1_000)
    const derived = deriveAgentState(app, ari, boogle, 1_000 + TOTAL_DURATION)
    expect(derived.status).toBe('submitted')
    expect(STAGES[derived.stage]).toBe('Submitted · Demo mode')
    expect(derived.submittedAt).toBe(1_000 + TOTAL_DURATION)
  })

  it('recalculates the correct mid-run stage from startedAt after a simulated refresh', () => {
    const app = makeApp(5_000)
    // "refresh": derive fresh from persisted startedAt at an arbitrary later time
    const derived = deriveAgentState(app, ari, boogle, 5_000 + STAGE_OFFSETS[4] + 50)
    expect(derived.stage).toBe(4)
    expect(derived.status).toBe('running')
    expect(derived.events[3].status).toBe('complete')
    expect(derived.events[4].status).toBe('running')
  })

  it('goes to action-required when a sensitive answer is missing, never inferring it', () => {
    const blank = emptyProfile() // no explicit work-authorisation answers
    blank.eligibility.backgroundCheckConsent = 'yes'
    blank.eligibility.agentMaySubmit = true
    const app = makeApp(0)
    const derived = deriveAgentState(app, blank, boogle, TOTAL_DURATION * 2)
    expect(derived.status).toBe('action-required')
    expect(derived.pending?.key).toBe(`workAuth:${boogle.country}`)
    expect(derived.submittedAt).toBeNull()
  })

  it('resumes to submission after the user answers explicitly', () => {
    const blank = emptyProfile()
    blank.eligibility.backgroundCheckConsent = 'yes'
    blank.eligibility.agentMaySubmit = true
    const stalled = makeApp(0)
    const resumed = resumedApplication(stalled, `workAuth:${boogle.country}`, 'Yes, authorised', 100_000)
    const derived = deriveAgentState(resumed, blank, boogle, 100_000 + TOTAL_DURATION)
    expect(derived.status).toBe('submitted')
  })

  it('seeded personas have explicit answers for every seeded job country', () => {
    for (const persona of PERSONAS) {
      for (const country of ['Singapore', 'Hong Kong', 'United Kingdom', 'United States']) {
        const job = { ...boogle, country }
        expect(missingSensitiveAnswer(persona.profile, job, {})).toBeNull()
      }
    }
  })
})
