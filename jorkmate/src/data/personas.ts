import type { UserProfile } from '../types'

/**
 * Three seeded demo personas. Every sensitive field (work authorisation,
 * sponsorship, background check, agent consent) is explicit so seeded personas
 * reach "Submitted · Demo mode" on all ten seeded jobs.
 */

export function emptyProfile(): UserProfile {
  return {
    id: `user-${Date.now()}`,
    personal: {
      fullName: '',
      email: '',
      phone: '',
      city: '',
      country: '',
      pronouns: '',
      earliestStart: '',
      noticePeriod: '',
      willingToRelocate: false,
      willingToTravel: false,
    },
    preferences: {
      industries: [],
      roles: [],
      locations: [],
      minCompensation: '',
      currency: 'SGD',
      workModes: [],
      employmentTypes: [],
      seniority: [],
    },
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    tools: [],
    languages: [],
    links: { linkedin: '', github: '', portfolio: '', website: '', other: '' },
    resume: null,
    eligibility: {
      workAuthorization: {},
      requiresSponsorship: {},
      desiredCompensation: '',
      currency: 'SGD',
      earliestStart: '',
      noticePeriod: '',
      willingAssessments: false,
      backgroundCheckConsent: null,
      preferredContact: 'Email',
      agentMaySubmit: false,
    },
    accessibility: {
      interviewAccommodations: null,
      interviewNotes: '',
      workplaceAccommodations: null,
      workplaceNotes: '',
    },
    demographics: {
      gender: 'Prefer not to say',
      ethnicity: 'Prefer not to say',
      veteranStatus: 'Prefer not to say',
      disabilityStatus: 'Prefer not to say',
    },
  }
}

export interface Persona {
  id: string
  tagline: string
  blurb: string
  accent: [string, string]
  profile: UserProfile
}

const ari: UserProfile = {
  ...emptyProfile(),
  id: 'persona-ari',
  personal: {
    fullName: 'Ari Tan',
    email: 'ari.tan@example.com',
    phone: '+65 8123 4567',
    city: 'Singapore',
    country: 'Singapore',
    pronouns: '',
    earliestStart: 'May 2026',
    noticePeriod: 'None — student',
    willingToRelocate: true,
    willingToTravel: true,
  },
  preferences: {
    industries: ['Software engineering', 'Data science and AI'],
    roles: ['Software Engineer', 'Data Scientist', 'ML Engineer'],
    locations: ['Singapore', 'Hong Kong'],
    minCompensation: '4000',
    currency: 'SGD',
    workModes: ['Hybrid', 'On-site'],
    employmentTypes: ['Internship', 'Graduate role'],
    seniority: ['Internship', 'Graduate'],
  },
  experience: [
    {
      id: 'ari-x1',
      title: 'Software Engineering Intern',
      company: 'Redwood Labs',
      location: 'Singapore',
      startMonth: 'May',
      startYear: '2025',
      endMonth: 'Aug',
      endYear: '2025',
      current: false,
      responsibilities: 'Built internal dashboards in React and TypeScript; wrote data pipelines in Python.',
      achievements: 'Cut report-generation time by 60% by moving aggregation into SQL.',
    },
    {
      id: 'ari-x2',
      title: 'Teaching Assistant, Data Structures',
      company: 'National University of Singapore',
      location: 'Singapore',
      startMonth: 'Aug',
      startYear: '2024',
      endMonth: '',
      endYear: '',
      current: true,
      responsibilities: 'Run weekly tutorials for 40 students; grade assignments and set practice problems.',
      achievements: 'Rated 4.8/5 in student feedback across two semesters.',
    },
  ],
  education: [
    {
      id: 'ari-e1',
      institution: 'National University of Singapore',
      degree: 'BComp',
      field: 'Computer Science',
      startYear: '2022',
      gradYear: '2026',
      grade: 'GPA 4.6/5.0',
      activities: 'Hackathon club lead; NUS Fintech Society',
    },
  ],
  certifications: [],
  skills: ['Python', 'TypeScript', 'React', 'SQL', 'Git', 'Machine learning'],
  tools: ['PyTorch', 'Pandas', 'Docker', 'Linux'],
  languages: ['English', 'Mandarin'],
  links: {
    linkedin: 'https://linkedin.com/in/ari-tan-demo',
    github: 'https://github.com/aritan-demo',
    portfolio: '',
    website: '',
    other: '',
  },
  resume: { fileName: 'ari-tan-resume.pdf', sizeKb: 182, uploadedAt: 1750000000000 },
  eligibility: {
    workAuthorization: {
      Singapore: true,
      'Hong Kong': false,
      'United Kingdom': false,
      'United States': false,
    },
    requiresSponsorship: {
      Singapore: false,
      'Hong Kong': true,
      'United Kingdom': true,
      'United States': true,
    },
    desiredCompensation: '4500',
    currency: 'SGD',
    earliestStart: 'May 2026',
    noticePeriod: 'None — student',
    willingAssessments: true,
    backgroundCheckConsent: 'yes',
    preferredContact: 'Email',
    agentMaySubmit: true,
  },
  accessibility: {
    interviewAccommodations: 'prefer-not-to-say',
    interviewNotes: '',
    workplaceAccommodations: 'prefer-not-to-say',
    workplaceNotes: '',
  },
}

/**
 * Maya Tan mirrors docs/superpowers/specs/2026-07-18-jorkmate-demo-profile.md —
 * the team's canonical demo candidate (source of truth for data/profile.json).
 * Values map 1:1 onto that contract; only the shape is this frontend's.
 */
const maya: UserProfile = {
  ...emptyProfile(),
  id: 'demo-maya-tan',
  personal: {
    fullName: 'Maya Tan',
    email: 'maya.tan.dev@gmail.com',
    phone: '+65 8123 4567',
    city: 'Singapore',
    country: 'Singapore',
    pronouns: 'she/her',
    earliestStart: '1 month from offer',
    noticePeriod: '1 month',
    willingToRelocate: true,
    willingToTravel: true,
  },
  preferences: {
    // canonical picks: Software & Developer Tools · Fintech · E-commerce
    industries: ['Software engineering', 'Fintech operations'],
    roles: ['Senior Software Engineer', 'Full-stack Engineer', 'Product Engineer'],
    locations: ['Singapore'],
    minCompensation: '120000',
    currency: 'SGD',
    workModes: ['Hybrid', 'Remote'],
    employmentTypes: ['Full-time'],
    seniority: ['Senior', 'Mid-level'],
  },
  experience: [
    {
      id: 'maya-x1',
      title: 'Senior Software Engineer',
      company: 'Grab',
      location: 'Singapore',
      startMonth: 'Jan',
      startYear: '2023',
      endMonth: '',
      endYear: '',
      current: true,
      responsibilities:
        'Led the checkout reliability workstream for GrabPay and own on-call playbooks for the payments team.',
      achievements:
        'Cut p99 payment latency 38%; shipped an idempotent refunds service (Go + PostgreSQL) handling 2M+ txns/day; mentored 4 engineers and halved payment incident MTTR.',
    },
    {
      id: 'maya-x2',
      title: 'Software Engineer',
      company: 'Shopee',
      location: 'Singapore',
      startMonth: 'Jun',
      startYear: '2020',
      endMonth: 'Dec',
      endYear: '2022',
      current: false,
      responsibilities:
        'Built seller-analytics dashboards (React, Node, ClickHouse) used by 300k+ sellers.',
      achievements:
        'Cut dashboard load time from 6s to under 1s with a query and caching redesign; drove TypeScript and CI test-gate adoption across the seller-tools squad.',
    },
    {
      id: 'maya-x3',
      title: 'Software Engineer Intern',
      company: 'GovTech Singapore',
      location: 'Singapore',
      startMonth: 'May',
      startYear: '2019',
      endMonth: 'Nov',
      endYear: '2019',
      current: false,
      responsibilities: 'Prototyped an accessibility linter for the internal design system.',
      achievements: 'Linter was adopted into the internal design system.',
    },
  ],
  education: [
    {
      id: 'maya-e1',
      institution: 'National University of Singapore',
      degree: 'B.Comp (Hons)',
      field: 'Computer Science',
      startYear: '2015',
      gradYear: '2019',
      grade: 'First Class Honours',
      activities: '',
    },
  ],
  certifications: [],
  skills: ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL', 'React', 'Node.js'],
  tools: ['Next.js', 'Tailwind CSS', 'Express', 'PostgreSQL', 'Redis', 'AWS', 'Docker', 'Kubernetes'],
  languages: ['English', 'Mandarin'],
  links: {
    linkedin: 'https://linkedin.com/in/mayatan-dev',
    github: 'https://github.com/mayatan',
    portfolio: 'https://mayatan.dev',
    website: '',
    other: '',
  },
  resume: { fileName: 'resume-maya-tan.pdf', sizeKb: 96, uploadedAt: 1750000000000 },
  eligibility: {
    workAuthorization: {
      Singapore: true, // Singapore Citizen — no sponsorship needed (critical for Workday screening)
      'Hong Kong': false,
      'United Kingdom': false,
      'United States': false,
    },
    requiresSponsorship: {
      Singapore: false,
      'Hong Kong': true,
      'United Kingdom': true,
      'United States': true,
    },
    desiredCompensation: '120,000–140,000',
    currency: 'SGD',
    earliestStart: '1 month from offer',
    noticePeriod: '1 month',
    willingAssessments: true,
    backgroundCheckConsent: 'yes',
    preferredContact: 'Email',
    agentMaySubmit: true,
  },
  accessibility: {
    interviewAccommodations: 'prefer-not-to-say',
    interviewNotes: '',
    workplaceAccommodations: 'prefer-not-to-say',
    workplaceNotes: '',
  },
}

const daniel: UserProfile = {
  ...emptyProfile(),
  id: 'persona-daniel',
  personal: {
    fullName: 'Daniel Brooks',
    email: 'daniel.brooks@example.com',
    phone: '+44 7700 900123',
    city: 'London',
    country: 'United Kingdom',
    pronouns: '',
    earliestStart: 'October 2026',
    noticePeriod: '3 months',
    willingToRelocate: true,
    willingToTravel: true,
  },
  preferences: {
    industries: ['Venture capital', 'Asset management', 'Investment banking'],
    roles: ['VC Associate', 'Investment Analyst'],
    locations: ['London', 'New York'],
    minCompensation: '70000',
    currency: 'GBP',
    workModes: ['Hybrid', 'On-site'],
    employmentTypes: ['Full-time'],
    seniority: ['Junior', 'Mid-level'],
  },
  experience: [
    {
      id: 'dan-x1',
      title: 'Financial Analyst',
      company: 'Argent Partners',
      location: 'London',
      startMonth: 'Sep',
      startYear: '2024',
      endMonth: '',
      endYear: '',
      current: true,
      responsibilities:
        'Build three-statement and DCF models for mid-market deals; prepare investment-committee papers.',
      achievements: 'Modelled six completed transactions totalling £340m; built the desk’s comps refresh tool in Python.',
    },
    {
      id: 'dan-x2',
      title: 'Investment Analyst Intern',
      company: 'Halcyon Asset Management',
      location: 'London',
      startMonth: 'Jun',
      startYear: '2023',
      endMonth: 'Sep',
      endYear: '2023',
      current: false,
      responsibilities: 'Screened European equities; maintained portfolio monitoring sheets on Bloomberg.',
      achievements: 'Pitched a long idea adopted into the intern paper portfolio, returning 12%.',
    },
  ],
  education: [
    {
      id: 'dan-e1',
      institution: 'London School of Economics',
      degree: 'BSc',
      field: 'Economics',
      startYear: '2021',
      gradYear: '2024',
      grade: 'First Class Honours',
      activities: 'Investment society; rowing club',
    },
  ],
  certifications: [{ id: 'dan-c1', name: 'CFA Level II Candidate', issuer: 'CFA Institute', year: '2026' }],
  skills: ['Financial modelling', 'Valuation', 'Due diligence', 'Excel', 'Python', 'Bloomberg'],
  tools: ['Excel', 'PowerPoint', 'Capital IQ', 'FactSet'],
  languages: ['English'],
  links: {
    linkedin: 'https://linkedin.com/in/daniel-brooks-demo',
    github: '',
    portfolio: '',
    website: '',
    other: '',
  },
  resume: { fileName: 'daniel-brooks-cv.pdf', sizeKb: 156, uploadedAt: 1750000000000 },
  eligibility: {
    workAuthorization: {
      'United Kingdom': true,
      'United States': false,
      Singapore: false,
      'Hong Kong': false,
    },
    requiresSponsorship: {
      'United Kingdom': false,
      'United States': true,
      Singapore: true,
      'Hong Kong': true,
    },
    desiredCompensation: '85000',
    currency: 'GBP',
    earliestStart: 'October 2026',
    noticePeriod: '3 months',
    willingAssessments: true,
    backgroundCheckConsent: 'yes',
    preferredContact: 'Email',
    agentMaySubmit: true,
  },
  accessibility: {
    interviewAccommodations: 'prefer-not-to-say',
    interviewNotes: '',
    workplaceAccommodations: 'prefer-not-to-say',
    workplaceNotes: '',
  },
}

export const PERSONAS: Persona[] = [
  {
    id: 'demo-maya-tan',
    tagline: 'Senior full-stack engineer',
    blurb: 'Five years shipping fintech and developer tools in Singapore (Grab, Shopee). The canonical Jorkmate demo candidate.',
    accent: ['#635bff', '#e5573f'],
    profile: maya,
  },
  {
    id: 'persona-ari',
    tagline: 'Software engineering student',
    blurb: 'CS at NUS, graduating 2026. Hunting software, AI, and data internships across Singapore and Hong Kong.',
    accent: ['#4f7cf0', '#7fd1c9'],
    profile: ari,
  },
  {
    id: 'persona-daniel',
    tagline: 'Analyst moving into VC',
    blurb: 'Two years of financial analysis in London. Aiming at venture capital and investment roles in London and New York.',
    accent: ['#0f3057', '#f0a04f'],
    profile: daniel,
  },
]
