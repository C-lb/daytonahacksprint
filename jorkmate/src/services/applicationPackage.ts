import type { ApplicationPackage, Job, ScreeningAnswer, UserProfile } from '../types'

/**
 * Deterministic template-based package generation. No LLM. Only facts stored in
 * the profile appear in the output — nothing is invented, and sensitive answers
 * come exclusively from explicit eligibility fields.
 */

function overlapSkills(profile: UserProfile, job: Job): string[] {
  const mine = new Set([...profile.skills, ...profile.tools].map((s) => s.toLowerCase()))
  return job.skills.filter((s) => mine.has(s.toLowerCase()))
}

function latestRole(profile: UserProfile): string | null {
  const x = profile.experience[0]
  return x ? `${x.title} at ${x.company}` : null
}

function latestEducation(profile: UserProfile): string | null {
  const e = profile.education[0]
  return e ? `${e.degree} in ${e.field} at ${e.institution}` : null
}

export function buildResumeSummary(profile: UserProfile, job: Job): string {
  const skills = overlapSkills(profile, job)
  const skillLine = skills.length
    ? `Core strengths relevant to this role include ${skills.slice(0, 4).join(', ')}.`
    : `Core strengths include ${profile.skills.slice(0, 4).join(', ')}.`
  const role = latestRole(profile)
  const edu = latestEducation(profile)
  const anchor = role
    ? `${profile.personal.fullName} is currently ${role}${edu ? `, with a ${edu}` : ''}.`
    : edu
      ? `${profile.personal.fullName} holds a ${edu}.`
      : `${profile.personal.fullName} is based in ${profile.personal.city}.`
  return `${anchor} ${skillLine} Seeking a ${job.title} position with ${job.company} in ${job.city}.`
}

export function buildCoverNote(profile: UserProfile, job: Job): string {
  const skills = overlapSkills(profile, job)
  const x = profile.experience[0]
  const resp = x ? x.responsibilities.replace(/\.$/, '') : ''
  const expLine = x
    ? `In my current role as ${x.title} at ${x.company}, ${resp.charAt(0).toLowerCase()}${resp.slice(1)}. ${x.achievements}`
    : `My background centres on ${profile.skills.slice(0, 3).join(', ')}.`
  const skillLine = skills.length
    ? `The requirements for this role map directly onto my experience with ${skills.slice(0, 3).join(', ')}.`
    : `My skill set in ${profile.skills.slice(0, 3).join(', ')} is closely adjacent to what this role asks for.`
  return (
    `Dear ${job.company} team,\n\n` +
    `I would like to be considered for the ${job.title} position in ${job.city}. ` +
    `${expLine} ${skillLine} ` +
    `I am drawn to ${job.company} because of its focus described in the listing, and the ${job.workMode.toLowerCase()} arrangement fits how I work best. ` +
    `I am available from ${profile.eligibility.earliestStart || profile.personal.earliestStart || 'the advertised start date'} and happy to complete any next steps.\n\n` +
    `Kind regards,\n${profile.personal.fullName}`
  )
}

export function buildStandardAnswers(profile: UserProfile, job: Job): { label: string; value: string }[] {
  return [
    { label: 'Full name', value: profile.personal.fullName },
    { label: 'Email', value: profile.personal.email },
    { label: 'Phone', value: profile.personal.phone },
    { label: 'Current location', value: `${profile.personal.city}, ${profile.personal.country}` },
    { label: 'Earliest start date', value: profile.eligibility.earliestStart || profile.personal.earliestStart },
    { label: 'Notice period', value: profile.eligibility.noticePeriod || profile.personal.noticePeriod },
    {
      label: 'Desired compensation',
      value: profile.eligibility.desiredCompensation
        ? `${profile.eligibility.currency} ${profile.eligibility.desiredCompensation}`
        : 'Not specified',
    },
    { label: 'Preferred contact method', value: profile.eligibility.preferredContact },
    { label: 'Résumé', value: profile.resume ? profile.resume.fileName : 'Profile-based application (no file)' },
    { label: 'Position', value: `${job.title} — ${job.company}` },
  ]
}

/** Sensitive answers are copied verbatim from explicit profile fields, never inferred. */
export function buildScreeningAnswers(
  profile: UserProfile,
  job: Job,
  extraAnswers: Record<string, string>,
): ScreeningAnswer[] {
  const answers: ScreeningAnswer[] = []
  const country = job.country
  const auth = profile.eligibility.workAuthorization[country]
  const sponsor = profile.eligibility.requiresSponsorship[country]
  const extraAuth = extraAnswers[`workAuth:${country}`]

  answers.push({
    question: `Are you legally authorised to work in ${country}?`,
    answer:
      extraAuth !== undefined
        ? extraAuth
        : auth === true
          ? 'Yes'
          : auth === false
            ? 'No'
            : 'Awaiting explicit answer',
    sensitive: true,
  })
  answers.push({
    question: 'Will you now or in the future require visa sponsorship?',
    answer:
      extraAuth !== undefined
        ? extraAuth
        : sponsor === true
          ? 'Yes, sponsorship required'
          : sponsor === false
            ? 'No'
            : 'Awaiting explicit answer',
    sensitive: true,
  })
  answers.push({
    question: 'Do you consent to a background check?',
    answer:
      extraAnswers['backgroundCheck'] ??
      (profile.eligibility.backgroundCheckConsent === 'yes'
        ? 'Yes'
        : profile.eligibility.backgroundCheckConsent === 'no'
          ? 'No'
          : 'Awaiting explicit answer'),
    sensitive: true,
  })
  answers.push({
    question: 'Are you willing to complete online assessments?',
    answer: profile.eligibility.willingAssessments ? 'Yes' : 'No',
    sensitive: false,
  })

  const skills = overlapSkills(profile, job)
  answers.push({
    question: `Which of the listed skills do you have hands-on experience with?`,
    answer: skills.length ? skills.join(', ') : 'Listed separately in résumé summary',
    sensitive: false,
  })
  return answers
}

export function generateApplicationPackage(
  profile: UserProfile,
  job: Job,
  extraAnswers: Record<string, string> = {},
): ApplicationPackage {
  return {
    resumeSummary: buildResumeSummary(profile, job),
    coverNote: buildCoverNote(profile, job),
    standardAnswers: buildStandardAnswers(profile, job),
    screeningAnswers: buildScreeningAnswers(profile, job, extraAnswers),
  }
}
