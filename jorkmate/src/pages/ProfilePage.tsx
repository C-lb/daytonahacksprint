import { useNavigate } from 'react-router-dom'
import { FileText, LogOut, Pencil, RefreshCcw, Trash2, UserRoundCog } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { SectionCard } from '../components/ui'

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="shrink-0 text-charcoal-soft">{label}</span>
      <span className="break-words text-right font-medium text-charcoal">{value}</span>
    </div>
  )
}

function TagRow({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-charcoal-soft">None added</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full bg-cream-deep px-2.5 py-1 text-xs font-semibold text-charcoal">
          {t}
        </span>
      ))}
    </div>
  )
}

const tri = (v: 'yes' | 'no' | 'prefer-not-to-say' | null) =>
  v === 'yes' ? 'Yes' : v === 'no' ? 'No' : v === 'prefer-not-to-say' ? 'Prefer not to say' : 'Not answered'

export function ProfilePage() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const p = state.profile!

  return (
    <div className="h-full overflow-y-auto bg-cream px-4 pb-8 pt-3">
      <header className="mb-4 px-1">
        <h1 className="font-display text-2xl font-bold text-charcoal">{p.personal.fullName}</h1>
        <p className="text-xs text-charcoal-soft">
          {p.personal.city}, {p.personal.country}
          {state.session?.personaId ? ' · demo persona' : ''}
        </p>
      </header>

      <SectionCard title="Personal information">
        <Row label="Email" value={p.personal.email} />
        <Row label="Phone" value={p.personal.phone} />
        <Row label="Pronouns" value={p.personal.pronouns} />
        <Row label="Earliest start" value={p.personal.earliestStart} />
        <Row label="Notice period" value={p.personal.noticePeriod} />
        <Row label="Open to relocating" value={p.personal.willingToRelocate ? 'Yes' : 'No'} />
        <Row label="Open to travel" value={p.personal.willingToTravel ? 'Yes' : 'No'} />
      </SectionCard>

      <SectionCard title="Preferences">
        <Row label="Industries" value={p.preferences.industries.join(', ')} />
        <Row label="Roles" value={p.preferences.roles.join(', ')} />
        <Row label="Locations" value={p.preferences.locations.join(', ')} />
        <Row
          label="Minimum compensation"
          value={p.preferences.minCompensation ? `${p.preferences.currency} ${p.preferences.minCompensation}` : ''}
        />
        <Row label="Work modes" value={p.preferences.workModes.join(', ')} />
        <Row label="Employment types" value={p.preferences.employmentTypes.join(', ')} />
        <Row label="Seniority" value={p.preferences.seniority.join(', ')} />
      </SectionCard>

      <SectionCard title="Experience">
        {p.experience.length === 0 && <p className="text-sm text-charcoal-soft">None added</p>}
        {p.experience.map((x) => (
          <div key={x.id} className="mb-3 border-b border-charcoal/5 pb-2 last:mb-0 last:border-0">
            <p className="text-sm font-bold text-charcoal">
              {x.title} · {x.company}
            </p>
            <p className="text-xs text-charcoal-soft">
              {x.startMonth} {x.startYear} – {x.current ? 'Present' : `${x.endMonth} ${x.endYear}`} · {x.location}
            </p>
            {x.responsibilities && <p className="mt-1 text-sm text-charcoal/85">{x.responsibilities}</p>}
            {x.achievements && <p className="mt-0.5 text-sm text-charcoal/85">{x.achievements}</p>}
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Education">
        {p.education.length === 0 && <p className="text-sm text-charcoal-soft">None added</p>}
        {p.education.map((e) => (
          <div key={e.id} className="mb-2">
            <p className="text-sm font-bold text-charcoal">
              {e.degree} in {e.field}
            </p>
            <p className="text-xs text-charcoal-soft">
              {e.institution} · {e.startYear}–{e.gradYear}
              {e.grade ? ` · ${e.grade}` : ''}
            </p>
          </div>
        ))}
        {p.certifications.length > 0 && (
          <>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-charcoal-soft">Certifications</p>
            {p.certifications.map((c) => (
              <p key={c.id} className="text-sm text-charcoal">
                {c.name}
                {c.issuer ? ` · ${c.issuer}` : ''}
              </p>
            ))}
          </>
        )}
      </SectionCard>

      <SectionCard title="Skills">
        <TagRow items={[...p.skills, ...p.tools]} />
        {p.languages.length > 0 && (
          <>
            <p className="mb-1 mt-3 text-xs font-bold uppercase tracking-wide text-charcoal-soft">Languages</p>
            <TagRow items={p.languages} />
          </>
        )}
      </SectionCard>

      <SectionCard title="Links & résumé">
        <Row label="LinkedIn" value={p.links.linkedin} />
        <Row label="GitHub" value={p.links.github} />
        <Row label="Portfolio" value={p.links.portfolio} />
        <Row label="Website" value={p.links.website} />
        <Row label="Other" value={p.links.other} />
        {p.resume ? (
          <p className="mt-2 flex items-center gap-2 rounded-xl bg-cream p-2.5 text-sm font-medium text-charcoal">
            <FileText size={16} className="text-coral" aria-hidden="true" />
            {p.resume.fileName}
            <span className="text-xs text-charcoal-soft">({p.resume.sizeKb} KB · demo mode)</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-charcoal-soft">No résumé uploaded</p>
        )}
      </SectionCard>

      <SectionCard title="Work eligibility">
        {Object.entries(p.eligibility.workAuthorization).map(([country, ok]) => (
          <Row key={country} label={`Authorised · ${country}`} value={ok ? 'Yes' : 'No'} />
        ))}
        {Object.entries(p.eligibility.requiresSponsorship).map(([country, needs]) => (
          <Row key={country} label={`Sponsorship · ${country}`} value={needs ? 'Required' : 'Not required'} />
        ))}
      </SectionCard>

      <SectionCard title="Application defaults">
        <Row
          label="Desired compensation"
          value={p.eligibility.desiredCompensation ? `${p.eligibility.currency} ${p.eligibility.desiredCompensation}` : ''}
        />
        <Row label="Earliest start" value={p.eligibility.earliestStart} />
        <Row label="Notice period" value={p.eligibility.noticePeriod} />
        <Row label="Willing to complete assessments" value={p.eligibility.willingAssessments ? 'Yes' : 'No'} />
        <Row
          label="Background check consent"
          value={p.eligibility.backgroundCheckConsent ? tri(p.eligibility.backgroundCheckConsent) : 'Not answered'}
        />
        <Row label="Preferred contact" value={p.eligibility.preferredContact} />
        <Row label="Agent may submit applications" value={p.eligibility.agentMaySubmit ? 'Yes' : 'No'} />
      </SectionCard>

      <SectionCard title="Accessibility & support">
        <Row label="Interview accommodations" value={tri(p.accessibility.interviewAccommodations)} />
        <Row label="Workplace accommodations" value={tri(p.accessibility.workplaceAccommodations)} />
        <p className="mt-2 text-xs leading-relaxed text-charcoal-soft">
          Private notes are never shown on job cards. The agent only ever uses answers you selected
          explicitly — Jorkmate never infers a disability or support requirement.
        </p>
      </SectionCard>

      <div className="mt-2 space-y-2.5">
        <button
          type="button"
          onClick={() => navigate('/onboarding?edit=1')}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3.5 text-sm font-bold text-cream active:scale-[0.98]"
        >
          <Pencil size={15} aria-hidden="true" /> Edit profile
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'SIGN_OUT' })
            navigate('/')
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-charcoal/20 bg-white py-3.5 text-sm font-bold text-charcoal active:scale-[0.98]"
        >
          <UserRoundCog size={15} aria-hidden="true" /> Switch demo persona
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'SIGN_OUT' })
            navigate('/')
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-charcoal/20 bg-white py-3.5 text-sm font-bold text-charcoal active:scale-[0.98]"
        >
          <LogOut size={15} aria-hidden="true" /> Sign out
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'RESET_DEMO' })
            showToast('Demo reset')
            navigate('/')
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-coral/40 bg-coral-soft py-3.5 text-sm font-bold text-coral-deep active:scale-[0.98]"
        >
          <Trash2 size={15} aria-hidden="true" /> Reset demo
        </button>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-charcoal-soft">
        <RefreshCcw size={11} aria-hidden="true" />
        Fictional listings and simulated submissions for demo purposes.
      </div>
    </div>
  )
}
