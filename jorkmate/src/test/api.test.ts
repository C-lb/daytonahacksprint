import { describe, expect, it } from 'vitest'
import { flattenSkills, toJob } from '../services/api'

const serverJob = {
  id: 'job-001',
  company: 'NVIDIA',
  title: 'Senior Software Engineer, AI Infrastructure',
  location: 'Singapore',
  salary: null,
  url: 'https://nvidia.wd5.myworkdayjobs.com/x/job/y',
  industry: 'Software & Developer Tools',
  description: 'Build the tooling that trains the models.',
  match: { score: 87, blurb: 'Your payments-reliability background maps to infra work.' },
}

describe('live job adapter', () => {
  it('maps the team-server job contract onto the frontend Job shape', () => {
    const job = toJob(serverJob)
    expect(job.source).toBe('live')
    expect(job.city).toBe('Singapore')
    expect(job.country).toBe('Singapore')
    expect(job.categories).toEqual(['Software & Developer Tools'])
    expect(job.match?.score).toBe(87)
    expect(job.workMode).toBeUndefined() // sparse fields stay absent, UI hides them
    expect(job.brand.initials).toBe('NV')
  })

  it('is defensive about null location and missing match', () => {
    const job = toJob({ ...serverJob, location: null, match: null })
    expect(job.city).toBe('See listing')
    expect(job.match).toBeNull()
  })

  it('flattens both categorized and flat skills from Kimi parses', () => {
    expect(flattenSkills({ languages: ['TypeScript'], frontend: ['React'] })).toEqual([
      'TypeScript',
      'React',
    ])
    expect(flattenSkills(['Go', 'SQL'])).toEqual(['Go', 'SQL'])
    expect(flattenSkills(undefined)).toEqual([])
  })
})
