export type WorkMode = 'Remote' | 'Hybrid' | 'On-site'
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Graduate role'
export type TriState = 'yes' | 'no' | 'prefer-not-to-say'

export interface Experience {
  id: string
  title: string
  company: string
  location: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  current: boolean
  responsibilities: string
  achievements: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startYear: string
  gradYear: string
  grade: string
  activities: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  year: string
}

export interface UserProfile {
  id: string
  personal: {
    fullName: string
    email: string
    phone: string
    city: string
    country: string
    pronouns: string
    earliestStart: string
    noticePeriod: string
    willingToRelocate: boolean
    willingToTravel: boolean
  }
  preferences: {
    industries: string[]
    roles: string[]
    locations: string[]
    minCompensation: string
    currency: string
    workModes: WorkMode[]
    employmentTypes: EmploymentType[]
    seniority: string[]
  }
  experience: Experience[]
  education: Education[]
  certifications: Certification[]
  skills: string[]
  tools: string[]
  languages: string[]
  links: { linkedin: string; github: string; portfolio: string; website: string; other: string }
  resume: { fileName: string; sizeKb: number; uploadedAt: number } | null
  eligibility: {
    /* explicit per-country answers; absence = unanswered, never inferred */
    workAuthorization: Record<string, boolean>
    requiresSponsorship: Record<string, boolean>
    desiredCompensation: string
    currency: string
    earliestStart: string
    noticePeriod: string
    willingAssessments: boolean
    backgroundCheckConsent: TriState | null
    preferredContact: 'Email' | 'Phone'
    agentMaySubmit: boolean
  }
  accessibility: {
    interviewAccommodations: TriState | null
    interviewNotes: string
    workplaceAccommodations: TriState | null
    workplaceNotes: string
  }
  demographics: {
    gender: string
    ethnicity: string
    veteranStatus: string
    disabilityStatus: string
  }
}

export type Sector = 'tech' | 'finance'

export interface Job {
  id: string
  company: string
  title: string
  city: string
  country: string
  categories: string[]
  sector: Sector
  workMode: WorkMode
  employmentType: EmploymentType
  seniority: string
  compMin: number
  compMax: number
  compPeriod: 'month' | 'year'
  currency: string
  compNote?: string
  summary: string
  companyDescription: string
  responsibilities: string[]
  requirements: string[]
  skills: string[]
  benefits: string[]
  sponsorship: 'Sponsorship available' | 'No sponsorship' | 'Case-by-case sponsorship'
  applicants: number
  popularity: number
  postedDaysAgo: number
  closingInDays: number
  rating: number
  reviewCount: number
  reviewExcerpt: string
  brand: { initials: string; from: string; to: string; pattern: 'dots' | 'waves' | 'grid' | 'rings' | 'diagonal' }
}

export type AgentStatus = 'queued' | 'running' | 'action-required' | 'submitted' | 'failed'

export interface ScreeningAnswer {
  question: string
  answer: string
  sensitive: boolean
}

export interface ApplicationPackage {
  resumeSummary: string
  coverNote: string
  standardAnswers: { label: string; value: string }[]
  screeningAnswers: ScreeningAnswer[]
}

export interface PendingQuestion {
  key: string
  question: string
}

/** One application = one agent run. Progress is derived from startedAt, never stored. */
export interface Application {
  id: string
  jobId: string
  profileId: string
  agentId: string
  createdAt: number
  startedAt: number
  extraAnswers: Record<string, string>
  pkg: ApplicationPackage
  clearedFromActivity: boolean
}

export interface AgentEvent {
  stage: number
  label: string
  at: number
  status: 'waiting' | 'running' | 'complete' | 'action-required' | 'failed'
}

export interface DerivedAgentState {
  stage: number
  status: AgentStatus
  pending: PendingQuestion | null
  events: AgentEvent[]
  submittedAt: number | null
}

export interface Session {
  name: string
  email: string
  personaId: string | null
  onboarded: boolean
  createdAt: number
}

export interface Settings {
  agentCounter: number
  boostJobId: string | null
}
