import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, FileUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { emptyProfile } from '../data/personas'
import type { Certification, Education, Experience, UserProfile, WorkMode, EmploymentType } from '../types'
import { KEYS, load, remove, save } from '../utils/storage'
import { ChipGroup, Field, TagInput, TextArea, TextInput, Toggle, TriStateSelect, inputCls } from '../components/ui'

const INDUSTRIES = [
  'Software engineering',
  'Data science and AI',
  'Product management',
  'Cybersecurity',
  'Quantitative research',
  'Investment banking',
  'Asset management',
  'Venture capital',
  'Fintech operations',
] as const

const LOCATIONS = ['Singapore', 'Hong Kong', 'London', 'New York'] as const
const COUNTRIES = ['Singapore', 'Hong Kong', 'United Kingdom', 'United States'] as const
const WORK_MODES: WorkMode[] = ['Remote', 'Hybrid', 'On-site']
const EMPLOYMENT_TYPES: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Graduate role']
const SENIORITY = ['Internship', 'Graduate', 'Junior', 'Mid-level', 'Senior'] as const
const CURRENCIES = ['SGD', 'HKD', 'GBP', 'USD'] as const
const STEP_TITLES = [
  'Personal details',
  'Role preferences',
  'Experience',
  'Education',
  'Skills, résumé & links',
  'Work eligibility & defaults',
  'Optional info & review',
]

const uid = () => Math.random().toString(36).slice(2, 9)

interface Draft {
  step: number
  profile: UserProfile
}

export function Onboarding() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1' && !!state.profile

  const [draft, setDraft] = useState<Draft>(() => {
    if (editing) return { step: 0, profile: state.profile! }
    const saved = load<Draft | null>(KEYS.onboardingDraft, null)
    if (saved?.profile) return saved
    const p = emptyProfile()
    if (state.session) {
      p.personal.fullName = state.session.name
      p.personal.email = state.session.email
    }
    return { step: 0, profile: p }
  })
  const [error, setError] = useState('')
  const [analysing, setAnalysing] = useState(false)
  const [resumeDone, setResumeDone] = useState(!!draft.profile.resume)
  const analyseTimer = useRef(0)

  const { step, profile } = draft
  const p = profile

  // Saved progress after every change
  useEffect(() => {
    if (!editing) save(KEYS.onboardingDraft, draft)
  }, [draft, editing])
  useEffect(() => () => window.clearTimeout(analyseTimer.current), [])

  const set = (patch: Partial<UserProfile>) =>
    setDraft((d) => ({ ...d, profile: { ...d.profile, ...patch } }))
  const setStep = (n: number) => {
    setError('')
    setDraft((d) => ({ ...d, step: n }))
  }

  const toggle = <T,>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  function validate(): string {
    if (step === 0) {
      if (!p.personal.fullName.trim()) return 'Add your full name'
      if (!/^\S+@\S+\.\S+$/.test(p.personal.email)) return 'Add a valid email'
      if (!p.personal.city.trim() || !p.personal.country.trim()) return 'Add your current city and country'
    }
    if (step === 1) {
      if (!p.preferences.industries.length) return 'Pick at least one industry'
      if (!p.preferences.locations.length) return 'Pick at least one location'
      if (!p.preferences.workModes.length) return 'Pick at least one work arrangement'
      if (!p.preferences.employmentTypes.length) return 'Pick at least one employment type'
    }
    if (step === 5) {
      const unanswered = COUNTRIES.filter(
        (c) => p.eligibility.workAuthorization[c] === undefined,
      )
      if (unanswered.length)
        return `Answer work authorisation for ${unanswered.join(', ')} — the agent never infers this`
      if (p.eligibility.backgroundCheckConsent === null)
        return 'Answer the background-check question — the agent never infers this'
      if (!p.eligibility.desiredCompensation.trim())
        return 'Add your desired compensation — the agent never infers this'
    }
    return ''
  }

  function next() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    if (step < 6) setStep(step + 1)
  }

  function finish() {
    dispatch({ type: 'COMPLETE_ONBOARDING', profile: p })
    remove(KEYS.onboardingDraft)
    showToast(editing ? 'Profile updated' : 'Profile saved — happy matching')
    navigate(editing ? '/app/profile' : '/app/discover')
  }

  function onResumePick(file: File | undefined) {
    if (!file) return
    setAnalysing(true)
    setResumeDone(false)
    // simulated parse: only filename + size stored, never the contents
    analyseTimer.current = window.setTimeout(() => {
      set({ resume: { fileName: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), uploadedAt: Date.now() } })
      setAnalysing(false)
      setResumeDone(true)
    }, 1500)
  }

  const expUpdate = (id: string, patch: Partial<Experience>) =>
    set({ experience: p.experience.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const eduUpdate = (id: string, patch: Partial<Education>) =>
    set({ education: p.education.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const certUpdate = (id: string, patch: Partial<Certification>) =>
    set({ certifications: p.certifications.map((x) => (x.id === id ? { ...x, ...patch } : x)) })

  const progress = useMemo(() => Math.round(((step + 1) / 7) * 100), [step])

  return (
    <div className="flex min-h-full flex-col bg-cream" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <header className="px-5 pb-3">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-xl font-bold text-charcoal">
            {editing ? 'Edit profile' : 'Set up once, apply everywhere'}
          </h1>
          <span className="text-xs font-semibold text-charcoal-soft">Step {step + 1} of 7</span>
        </div>
        <p className="mt-0.5 text-sm text-charcoal-soft">{STEP_TITLES[step]}</p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-cream-deep"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        >
          <div className="h-full rounded-full bg-coral transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.18 }}
          >
            {step === 0 && (
              <>
                <Field label="Full name" htmlFor="ob-name">
                  <TextInput id="ob-name" value={p.personal.fullName} onChange={(e) => set({ personal: { ...p.personal, fullName: e.target.value } })} />
                </Field>
                <Field label="Email" htmlFor="ob-email">
                  <TextInput id="ob-email" type="email" value={p.personal.email} onChange={(e) => set({ personal: { ...p.personal, email: e.target.value } })} />
                </Field>
                <Field label="Phone number" htmlFor="ob-phone">
                  <TextInput id="ob-phone" type="tel" value={p.personal.phone} onChange={(e) => set({ personal: { ...p.personal, phone: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Current city" htmlFor="ob-city">
                    <TextInput id="ob-city" value={p.personal.city} onChange={(e) => set({ personal: { ...p.personal, city: e.target.value } })} />
                  </Field>
                  <Field label="Current country" htmlFor="ob-country">
                    <TextInput id="ob-country" value={p.personal.country} onChange={(e) => set({ personal: { ...p.personal, country: e.target.value } })} />
                  </Field>
                </div>
                <Field label="Preferred pronouns" optional htmlFor="ob-pronouns">
                  <TextInput id="ob-pronouns" placeholder="e.g. she/her" value={p.personal.pronouns} onChange={(e) => set({ personal: { ...p.personal, pronouns: e.target.value } })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Earliest start date" htmlFor="ob-start">
                    <TextInput id="ob-start" placeholder="e.g. May 2026" value={p.personal.earliestStart} onChange={(e) => set({ personal: { ...p.personal, earliestStart: e.target.value } })} />
                  </Field>
                  <Field label="Notice period" htmlFor="ob-notice">
                    <TextInput id="ob-notice" placeholder="e.g. 1 month" value={p.personal.noticePeriod} onChange={(e) => set({ personal: { ...p.personal, noticePeriod: e.target.value } })} />
                  </Field>
                </div>
                <div className="space-y-2.5">
                  <Toggle label="Willing to relocate" checked={p.personal.willingToRelocate} onChange={(v) => set({ personal: { ...p.personal, willingToRelocate: v } })} />
                  <Toggle label="Willing to travel for work" checked={p.personal.willingToTravel} onChange={(v) => set({ personal: { ...p.personal, willingToTravel: v } })} />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Preferred industries">
                  <ChipGroup label="Preferred industries" options={INDUSTRIES} selected={p.preferences.industries} onToggle={(v) => set({ preferences: { ...p.preferences, industries: toggle(p.preferences.industries, v) } })} />
                </Field>
                <Field label="Preferred roles">
                  <TagInput label="Preferred roles" placeholder="e.g. Software Engineer" tags={p.preferences.roles} onChange={(roles) => set({ preferences: { ...p.preferences, roles } })} />
                </Field>
                <Field label="Preferred locations">
                  <ChipGroup label="Preferred locations" options={LOCATIONS} selected={p.preferences.locations} onToggle={(v) => set({ preferences: { ...p.preferences, locations: toggle(p.preferences.locations, v) } })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Minimum compensation" htmlFor="ob-comp">
                    <TextInput id="ob-comp" inputMode="numeric" placeholder="e.g. 60000" value={p.preferences.minCompensation} onChange={(e) => set({ preferences: { ...p.preferences, minCompensation: e.target.value } })} />
                  </Field>
                  <Field label="Currency" htmlFor="ob-currency">
                    <select id="ob-currency" className={inputCls} value={p.preferences.currency} onChange={(e) => set({ preferences: { ...p.preferences, currency: e.target.value } })}>
                      {CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Work arrangements">
                  <ChipGroup label="Work arrangements" options={WORK_MODES} selected={p.preferences.workModes} onToggle={(v) => set({ preferences: { ...p.preferences, workModes: toggle(p.preferences.workModes, v as WorkMode) } })} />
                </Field>
                <Field label="Employment types">
                  <ChipGroup label="Employment types" options={EMPLOYMENT_TYPES} selected={p.preferences.employmentTypes} onToggle={(v) => set({ preferences: { ...p.preferences, employmentTypes: toggle(p.preferences.employmentTypes, v as EmploymentType) } })} />
                </Field>
                <Field label="Seniority preferences">
                  <ChipGroup label="Seniority preferences" options={SENIORITY} selected={p.preferences.seniority} onToggle={(v) => set({ preferences: { ...p.preferences, seniority: toggle(p.preferences.seniority, v) } })} />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                {p.experience.map((x, i) => (
                  <div key={x.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-charcoal">Experience {i + 1}</p>
                      <button type="button" aria-label={`Remove experience ${i + 1}`} onClick={() => set({ experience: p.experience.filter((e) => e.id !== x.id) })} className="text-charcoal-soft hover:text-coral-deep">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Field label="Job title">
                      <TextInput value={x.title} onChange={(e) => expUpdate(x.id, { title: e.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Company">
                        <TextInput value={x.company} onChange={(e) => expUpdate(x.id, { company: e.target.value })} />
                      </Field>
                      <Field label="Location">
                        <TextInput value={x.location} onChange={(e) => expUpdate(x.id, { location: e.target.value })} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start (month, year)">
                        <div className="flex gap-2">
                          <TextInput aria-label="Start month" placeholder="Jan" value={x.startMonth} onChange={(e) => expUpdate(x.id, { startMonth: e.target.value })} />
                          <TextInput aria-label="Start year" placeholder="2024" value={x.startYear} onChange={(e) => expUpdate(x.id, { startYear: e.target.value })} />
                        </div>
                      </Field>
                      <Field label="End (month, year)">
                        <div className="flex gap-2">
                          <TextInput aria-label="End month" placeholder="Dec" disabled={x.current} value={x.endMonth} onChange={(e) => expUpdate(x.id, { endMonth: e.target.value })} />
                          <TextInput aria-label="End year" placeholder="2025" disabled={x.current} value={x.endYear} onChange={(e) => expUpdate(x.id, { endYear: e.target.value })} />
                        </div>
                      </Field>
                    </div>
                    <div className="mb-3">
                      <Toggle label="I currently work here" checked={x.current} onChange={(v) => expUpdate(x.id, { current: v })} />
                    </div>
                    <Field label="Responsibilities">
                      <TextArea value={x.responsibilities} onChange={(e) => expUpdate(x.id, { responsibilities: e.target.value })} />
                    </Field>
                    <Field label="Achievements">
                      <TextArea value={x.achievements} onChange={(e) => expUpdate(x.id, { achievements: e.target.value })} />
                    </Field>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set({ experience: [...p.experience, { id: uid(), title: '', company: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', current: false, responsibilities: '', achievements: '' }] })}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 py-3.5 text-sm font-bold text-charcoal-soft hover:border-coral hover:text-coral"
                >
                  <Plus size={16} aria-hidden="true" /> Add experience
                </button>
                {p.experience.length === 0 && (
                  <p className="mt-3 text-center text-xs text-charcoal-soft">Students and first-jobbers can skip this step.</p>
                )}
              </>
            )}

            {step === 3 && (
              <>
                {p.education.map((e, i) => (
                  <div key={e.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-charcoal">Education {i + 1}</p>
                      <button type="button" aria-label={`Remove education ${i + 1}`} onClick={() => set({ education: p.education.filter((x) => x.id !== e.id) })} className="text-charcoal-soft hover:text-coral-deep">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Field label="Institution">
                      <TextInput value={e.institution} onChange={(ev) => eduUpdate(e.id, { institution: ev.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Degree">
                        <TextInput placeholder="e.g. BSc" value={e.degree} onChange={(ev) => eduUpdate(e.id, { degree: ev.target.value })} />
                      </Field>
                      <Field label="Field of study">
                        <TextInput value={e.field} onChange={(ev) => eduUpdate(e.id, { field: ev.target.value })} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start year">
                        <TextInput placeholder="2022" value={e.startYear} onChange={(ev) => eduUpdate(e.id, { startYear: ev.target.value })} />
                      </Field>
                      <Field label="Graduation year">
                        <TextInput placeholder="2026" value={e.gradYear} onChange={(ev) => eduUpdate(e.id, { gradYear: ev.target.value })} />
                      </Field>
                    </div>
                    <Field label="Grade or GPA" optional>
                      <TextInput value={e.grade} onChange={(ev) => eduUpdate(e.id, { grade: ev.target.value })} />
                    </Field>
                    <Field label="Activities" optional>
                      <TextInput value={e.activities} onChange={(ev) => eduUpdate(e.id, { activities: ev.target.value })} />
                    </Field>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set({ education: [...p.education, { id: uid(), institution: '', degree: '', field: '', startYear: '', gradYear: '', grade: '', activities: '' }] })}
                  className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 py-3.5 text-sm font-bold text-charcoal-soft hover:border-coral hover:text-coral"
                >
                  <Plus size={16} aria-hidden="true" /> Add education
                </button>

                <h3 className="font-display mb-2 text-base font-bold text-charcoal">Certifications</h3>
                {p.certifications.map((c, i) => (
                  <div key={c.id} className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-charcoal">Certification {i + 1}</p>
                      <button type="button" aria-label={`Remove certification ${i + 1}`} onClick={() => set({ certifications: p.certifications.filter((x) => x.id !== c.id) })} className="text-charcoal-soft hover:text-coral-deep">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Field label="Name">
                      <TextInput value={c.name} onChange={(ev) => certUpdate(c.id, { name: ev.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Issuer" optional>
                        <TextInput value={c.issuer} onChange={(ev) => certUpdate(c.id, { issuer: ev.target.value })} />
                      </Field>
                      <Field label="Year" optional>
                        <TextInput value={c.year} onChange={(ev) => certUpdate(c.id, { year: ev.target.value })} />
                      </Field>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set({ certifications: [...p.certifications, { id: uid(), name: '', issuer: '', year: '' }] })}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 py-3 text-sm font-bold text-charcoal-soft hover:border-coral hover:text-coral"
                >
                  <Plus size={16} aria-hidden="true" /> Add certification
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <Field label="Skills">
                  <TagInput label="Skills" placeholder="e.g. Python" tags={p.skills} onChange={(skills) => set({ skills })} />
                </Field>
                <Field label="Tools & technologies">
                  <TagInput label="Tools and technologies" placeholder="e.g. Docker" tags={p.tools} onChange={(tools) => set({ tools })} />
                </Field>
                <Field label="Languages">
                  <TagInput label="Languages" placeholder="e.g. English" tags={p.languages} onChange={(languages) => set({ languages })} />
                </Field>

                <h3 className="font-display mb-2 mt-6 text-base font-bold text-charcoal">Résumé</h3>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-charcoal/20 bg-white p-6 text-center hover:border-coral">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="sr-only"
                    aria-label="Upload résumé"
                    onChange={(e) => onResumePick(e.target.files?.[0])}
                  />
                  {analysing ? (
                    <>
                      <Loader2 size={22} className="animate-spin text-coral" aria-hidden="true" />
                      <span className="text-sm font-semibold text-charcoal">Analysing résumé…</span>
                    </>
                  ) : resumeDone && p.resume ? (
                    <>
                      <CheckCircle2 size={22} className="text-sage" aria-hidden="true" />
                      <span className="text-sm font-semibold text-charcoal">{p.resume.fileName}</span>
                      <span className="text-xs font-medium text-sage">Résumé processed in demo mode</span>
                    </>
                  ) : (
                    <>
                      <FileUp size={22} className="text-charcoal-soft" aria-hidden="true" />
                      <span className="text-sm font-semibold text-charcoal">Upload résumé</span>
                      <span className="text-xs text-charcoal-soft">Simulated — only the filename is stored, never the file.</span>
                    </>
                  )}
                </label>

                <h3 className="font-display mb-2 mt-6 text-base font-bold text-charcoal">Links</h3>
                <Field label="LinkedIn URL" optional>
                  <TextInput type="url" value={p.links.linkedin} onChange={(e) => set({ links: { ...p.links, linkedin: e.target.value } })} />
                </Field>
                <Field label="GitHub URL" optional>
                  <TextInput type="url" value={p.links.github} onChange={(e) => set({ links: { ...p.links, github: e.target.value } })} />
                </Field>
                <Field label="Portfolio URL" optional>
                  <TextInput type="url" value={p.links.portfolio} onChange={(e) => set({ links: { ...p.links, portfolio: e.target.value } })} />
                </Field>
                <Field label="Personal website" optional>
                  <TextInput type="url" value={p.links.website} onChange={(e) => set({ links: { ...p.links, website: e.target.value } })} />
                </Field>
                <Field label="Other link" optional>
                  <TextInput type="url" value={p.links.other} onChange={(e) => set({ links: { ...p.links, other: e.target.value } })} />
                </Field>
              </>
            )}

            {step === 5 && (
              <>
                <p className="mb-4 rounded-xl bg-coral-soft p-3 text-xs leading-relaxed text-coral-deep">
                  The agent never infers work authorisation, sponsorship, legal declarations, or
                  compensation. Answer explicitly — only your answers are ever used.
                </p>
                {COUNTRIES.map((c) => (
                  <div key={c} className="mb-3 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-2 text-sm font-bold text-charcoal">{c}</p>
                    <div className="mb-2">
                      <p className="mb-1.5 text-xs font-semibold text-charcoal-soft">Authorised to work here?</p>
                      <div className="flex gap-2">
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            aria-pressed={p.eligibility.workAuthorization[c] === v}
                            onClick={() =>
                              set({
                                eligibility: {
                                  ...p.eligibility,
                                  workAuthorization: { ...p.eligibility.workAuthorization, [c]: v },
                                  requiresSponsorship: { ...p.eligibility.requiresSponsorship, [c]: !v },
                                },
                              })
                            }
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                              p.eligibility.workAuthorization[c] === v
                                ? 'border-coral bg-coral text-white'
                                : 'border-charcoal/20 bg-white text-charcoal'
                            }`}
                          >
                            {v ? 'Yes' : 'No — needs sponsorship'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Desired compensation" htmlFor="el-comp">
                    <TextInput id="el-comp" inputMode="numeric" value={p.eligibility.desiredCompensation} onChange={(e) => set({ eligibility: { ...p.eligibility, desiredCompensation: e.target.value } })} />
                  </Field>
                  <Field label="Currency" htmlFor="el-currency">
                    <select id="el-currency" className={inputCls} value={p.eligibility.currency} onChange={(e) => set({ eligibility: { ...p.eligibility, currency: e.target.value } })}>
                      {CURRENCIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Earliest start date" htmlFor="el-start">
                    <TextInput id="el-start" value={p.eligibility.earliestStart} onChange={(e) => set({ eligibility: { ...p.eligibility, earliestStart: e.target.value } })} />
                  </Field>
                  <Field label="Notice period" htmlFor="el-notice">
                    <TextInput id="el-notice" value={p.eligibility.noticePeriod} onChange={(e) => set({ eligibility: { ...p.eligibility, noticePeriod: e.target.value } })} />
                  </Field>
                </div>
                <div className="space-y-2.5">
                  <Toggle label="Willing to complete assessments" checked={p.eligibility.willingAssessments} onChange={(v) => set({ eligibility: { ...p.eligibility, willingAssessments: v } })} />
                </div>
                <div className="mt-4">
                  <Field label="Willing to undergo a background check">
                    <TriStateSelect label="Background check" value={p.eligibility.backgroundCheckConsent} onChange={(v) => set({ eligibility: { ...p.eligibility, backgroundCheckConsent: v } })} />
                  </Field>
                </div>
                <Field label="Preferred contact method">
                  <div className="flex gap-2">
                    {(['Email', 'Phone'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={p.eligibility.preferredContact === m}
                        onClick={() => set({ eligibility: { ...p.eligibility, preferredContact: m } })}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                          p.eligibility.preferredContact === m
                            ? 'border-charcoal bg-charcoal text-cream'
                            : 'border-charcoal/20 bg-white text-charcoal'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="mt-2">
                  <Toggle label="Agent may submit applications with my saved answers" checked={p.eligibility.agentMaySubmit} onChange={(v) => set({ eligibility: { ...p.eligibility, agentMaySubmit: v } })} />
                  <p className="mt-1.5 text-xs text-charcoal-soft">
                    If off, every application pauses for your approval before submission.
                  </p>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <p className="mb-4 rounded-xl bg-cream-deep p-3 text-xs leading-relaxed text-charcoal">
                  These questions are optional. Jorkmate never infers a disability or support
                  requirement, the agent only uses answers you explicitly select, and private notes
                  are never shown on job cards.
                </p>
                <Field label="Would you like to request any accommodations or assistance during the interview process?">
                  <TriStateSelect label="Interview accommodations" value={p.accessibility.interviewAccommodations} onChange={(v) => set({ accessibility: { ...p.accessibility, interviewAccommodations: v } })} />
                  {p.accessibility.interviewAccommodations === 'yes' && (
                    <TextArea
                      aria-label="Private interview accommodation notes"
                      className="mt-2"
                      placeholder="Private instructions — shared only when you apply"
                      value={p.accessibility.interviewNotes}
                      onChange={(e) => set({ accessibility: { ...p.accessibility, interviewNotes: e.target.value } })}
                    />
                  )}
                </Field>
                <Field label="Would you like to request any accommodations or assistance in the workplace?">
                  <TriStateSelect label="Workplace accommodations" value={p.accessibility.workplaceAccommodations} onChange={(v) => set({ accessibility: { ...p.accessibility, workplaceAccommodations: v } })} />
                  {p.accessibility.workplaceAccommodations === 'yes' && (
                    <TextArea
                      aria-label="Private workplace accommodation notes"
                      className="mt-2"
                      placeholder="Private instructions — shared only when you apply"
                      value={p.accessibility.workplaceNotes}
                      onChange={(e) => set({ accessibility: { ...p.accessibility, workplaceNotes: e.target.value } })}
                    />
                  )}
                </Field>

                <h3 className="font-display mb-2 mt-6 text-base font-bold text-charcoal">Optional demographics</h3>
                {(
                  [
                    ['gender', 'Gender'],
                    ['ethnicity', 'Ethnicity'],
                    ['veteranStatus', 'Veteran status'],
                    ['disabilityStatus', 'Disability status'],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label} optional>
                    <div className="flex flex-wrap gap-2">
                      {['Prefer not to say', 'Self-describe'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          aria-pressed={
                            opt === 'Prefer not to say'
                              ? p.demographics[key] === 'Prefer not to say'
                              : p.demographics[key] !== 'Prefer not to say'
                          }
                          onClick={() => set({ demographics: { ...p.demographics, [key]: opt === 'Prefer not to say' ? 'Prefer not to say' : '' } })}
                          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                            (opt === 'Prefer not to say') === (p.demographics[key] === 'Prefer not to say')
                              ? 'border-charcoal bg-charcoal text-cream'
                              : 'border-charcoal/20 bg-white text-charcoal'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {p.demographics[key] !== 'Prefer not to say' && (
                      <TextInput
                        aria-label={`${label} self-description`}
                        className="mt-2"
                        placeholder="Your words, entirely optional"
                        value={p.demographics[key]}
                        onChange={(e) => set({ demographics: { ...p.demographics, [key]: e.target.value } })}
                      />
                    )}
                  </Field>
                ))}

                <h3 className="font-display mb-2 mt-6 text-base font-bold text-charcoal">Review</h3>
                <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="font-bold text-charcoal">{p.personal.fullName}</p>
                  <p className="text-charcoal-soft">{p.personal.email} · {p.personal.city}, {p.personal.country}</p>
                  <p className="mt-2 text-charcoal">
                    <span className="font-semibold">Wants:</span> {p.preferences.industries.join(', ') || '—'} in{' '}
                    {p.preferences.locations.join(', ') || '—'}
                  </p>
                  <p className="text-charcoal">
                    <span className="font-semibold">Modes:</span> {p.preferences.workModes.join(', ') || '—'} ·{' '}
                    {p.preferences.employmentTypes.join(', ') || '—'}
                  </p>
                  <p className="text-charcoal">
                    <span className="font-semibold">Skills:</span> {p.skills.slice(0, 6).join(', ') || '—'}
                  </p>
                  <p className="text-charcoal">
                    <span className="font-semibold">Experience:</span> {p.experience.length} · <span className="font-semibold">Education:</span> {p.education.length}
                  </p>
                  <p className="text-charcoal">
                    <span className="font-semibold">Résumé:</span> {p.resume ? p.resume.fileName : 'None'}
                  </p>
                  <p className="text-charcoal">
                    <span className="font-semibold">Agent may submit:</span> {p.eligibility.agentMaySubmit ? 'Yes' : 'Paused for approval each time'}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-coral-soft p-3 text-sm font-semibold text-coral-deep">
            {error}
          </p>
        )}
      </div>

      <div
        className="flex shrink-0 gap-3 border-t border-charcoal/10 bg-cream px-5 py-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          className="rounded-full border border-charcoal/20 bg-white px-6 py-3.5 text-sm font-bold text-charcoal active:scale-95 disabled:opacity-40"
        >
          Back
        </button>
        {step < 6 ? (
          <button
            type="button"
            onClick={next}
            className="flex-1 rounded-full bg-coral py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/25 active:scale-[0.98]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="flex-1 rounded-full bg-coral py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/25 active:scale-[0.98]"
          >
            {editing ? 'Save profile' : 'Start matching'}
          </button>
        )}
      </div>
    </div>
  )
}
