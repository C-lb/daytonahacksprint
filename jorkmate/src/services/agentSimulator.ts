import type {
  Application,
  DerivedAgentState,
  Job,
  PendingQuestion,
  UserProfile,
  AgentEvent,
} from '../types'

export const STAGES = [
  'Application queued',
  'Agent spawned',
  'Analysing job requirements',
  'Reviewing saved profile',
  'Tailoring résumé summary',
  'Drafting cover note',
  'Completing standard application fields',
  'Answering screening questions',
  'Running compliance checks',
  'Submitted · Demo mode',
] as const

/** Cumulative ms offsets from startedAt. Total run ≈ 12.8s. */
export const STAGE_OFFSETS = [0, 500, 1400, 2900, 4600, 6300, 8000, 9700, 11200, 12800]
export const TOTAL_DURATION = STAGE_OFFSETS[STAGE_OFFSETS.length - 1]
export const SCREENING_STAGE = 7
export const COMPLIANCE_STAGE = 8
export const SUBMITTED_STAGE = 9

/**
 * Safeguard layer: sensitive answers are never inferred. If the profile (or a
 * user-supplied resume answer) lacks an explicit answer, the agent stalls with
 * "Action required" instead of guessing.
 */
export function missingSensitiveAnswer(
  profile: UserProfile,
  job: Job,
  extraAnswers: Record<string, string>,
): PendingQuestion | null {
  const country = job.country
  const auth = profile.eligibility.workAuthorization[country]
  const sponsor = profile.eligibility.requiresSponsorship[country]
  const authKey = `workAuth:${country}`
  if (country && auth === undefined && sponsor === undefined && !(authKey in extraAnswers)) {
    return {
      key: authKey,
      question: `Are you authorised to work in ${country}, or would you require visa sponsorship? The agent will not answer this for you.`,
    }
  }
  if (profile.eligibility.backgroundCheckConsent === null && !('backgroundCheck' in extraAnswers)) {
    return {
      key: 'backgroundCheck',
      question: 'This employer runs a background check. Do you consent? The agent will not answer this for you.',
    }
  }
  if (!profile.eligibility.agentMaySubmit && !('submitConsent' in extraAnswers)) {
    return {
      key: 'submitConsent',
      question: 'You have not authorised the agent to submit applications with saved answers. Approve this submission?',
    }
  }
  return null
}

/** Pure derivation: (application, profile, job, now) → stage/status/events. Survives reloads. */
export function deriveAgentState(
  app: Application,
  profile: UserProfile,
  job: Job,
  now: number,
): DerivedAgentState {
  const elapsed = Math.max(0, now - app.startedAt)
  let stage = 0
  for (let i = 0; i < STAGE_OFFSETS.length; i++) {
    if (elapsed >= STAGE_OFFSETS[i]) stage = i
  }

  const pending = missingSensitiveAnswer(profile, job, app.extraAnswers)
  const blockedStage = pending?.key === 'submitConsent' ? COMPLIANCE_STAGE : SCREENING_STAGE
  const blocked = pending !== null && stage >= blockedStage

  if (blocked) stage = blockedStage

  const status = blocked
    ? 'action-required'
    : stage >= SUBMITTED_STAGE
      ? 'submitted'
      : stage === 0
        ? 'queued'
        : 'running'

  const events: AgentEvent[] = STAGES.map((label, i) => ({
    stage: i,
    label,
    at: app.startedAt + STAGE_OFFSETS[i],
    status:
      blocked && i === blockedStage
        ? 'action-required'
        : i < stage || status === 'submitted'
          ? 'complete'
          : i === stage
            ? 'running'
            : 'waiting',
  }))

  return {
    stage,
    status,
    pending: blocked ? pending : null,
    events,
    submittedAt: status === 'submitted' ? app.startedAt + TOTAL_DURATION : null,
  }
}

/** Resume a stalled agent: answer recorded, clock rewound to the blocked stage. */
export function resumedApplication(
  app: Application,
  key: string,
  answer: string,
  now: number,
): Application {
  const stage = key === 'submitConsent' ? COMPLIANCE_STAGE : SCREENING_STAGE
  return {
    ...app,
    extraAnswers: { ...app.extraAnswers, [key]: answer },
    startedAt: now - STAGE_OFFSETS[stage],
  }
}

/** Fast-forward: shift startedAt so the full run has already elapsed. */
export function fastForwardedApplication(app: Application, now: number): Application {
  return { ...app, startedAt: Math.min(app.startedAt, now - TOTAL_DURATION) }
}
