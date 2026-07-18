import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Flame,
  MapPin,
  Star,
  Users,
} from 'lucide-react'
import type { Job } from '../types'
import { CompanyPanel } from './CompanyPanel'

export function formatComp(job: Job): string {
  if (job.compMin === undefined || job.compMax === undefined)
    return job.salaryText ?? 'Compensation on listing'
  const f = (n: number) => n.toLocaleString('en-US')
  const per = job.compPeriod === 'month' ? '/mo' : '/yr'
  return `${job.currency} ${f(job.compMin)}–${f(job.compMax)}${per}${job.compNote ? ` ${job.compNote}` : ''}`
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-cream-deep px-2.5 py-1 text-xs font-semibold text-charcoal">
      {children}
    </span>
  )
}

function ListSection({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null
  return (
    <section className="mt-6">
      <h3 className="font-display text-sm font-bold text-charcoal">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 text-xs leading-relaxed text-charcoal/85">
            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
            {it}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Full job content. The card body scrolls vertically, there is no separate job-detail screen. */
export function JobCard({ job, match }: { job: Job; match: number }) {
  return (
    <article
      aria-label={`${job.title} at ${job.company}`}
      className="flex h-full flex-col overflow-hidden rounded-3xl bg-surface raised"
    >
      <div className="relative shrink-0">
        <CompanyPanel job={job} />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1 text-sm font-bold text-charcoal backdrop-blur">
          {match}% match
        </div>
        {(job.popularity ?? 0) >= 85 && (
          <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-charcoal/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            <Flame size={13} aria-hidden="true" className="text-coral" /> Trending
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-7 pt-5" data-scrollable>
        <p className="text-xs font-semibold tracking-wide text-coral">{job.company}</p>
        <h2 className="font-display mt-1 break-words text-lg font-bold leading-snug text-charcoal">
          {job.title}
        </h2>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-charcoal-soft">
          <MapPin size={13} aria-hidden="true" />
          {job.city}
          {job.country && job.country !== job.city ? `, ${job.country}` : ''}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.workMode && <Pill>{job.workMode}</Pill>}
          {job.employmentType && <Pill>{job.employmentType}</Pill>}
          {job.seniority && <Pill>{job.seniority}</Pill>}
          {job.sponsorship && <Pill>{job.sponsorship}</Pill>}
          {job.categories.map((c) => job.source === 'live' && <Pill key={c}>{c}</Pill>)}
        </div>

        <p className="mt-4 text-sm font-bold text-charcoal">{formatComp(job)}</p>

        {job.match?.blurb && (
          <p className="mt-4 rounded-2xl bg-coral-soft p-3.5 text-xs italic leading-relaxed text-coral-deep">
            “{job.match.blurb}”
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-soft">
          {job.applicants !== undefined && (
            <span className="flex items-center gap-1">
              <Users size={13} aria-hidden="true" /> {job.applicants} applicants
            </span>
          )}
          {job.postedDaysAgo !== undefined && (
            <span className="flex items-center gap-1">
              <CalendarDays size={13} aria-hidden="true" /> Posted {job.postedDaysAgo}d ago
            </span>
          )}
          {job.closingInDays !== undefined && job.closingInDays <= 10 && (
            <span className="flex items-center gap-1 font-semibold text-coral-deep">
              <Clock3 size={13} aria-hidden="true" /> Closes in {job.closingInDays}d
            </span>
          )}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-charcoal/90">{job.summary}</p>

        {job.companyDescription && (
          <section className="mt-6 rounded-2xl bg-cream p-3.5">
            <h3 className="font-display text-sm font-bold text-charcoal">About {job.company}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-charcoal/85">{job.companyDescription}</p>
          </section>
        )}

        <ListSection title="What you'll do" items={job.responsibilities} />
        <ListSection title="What they're looking for" items={job.requirements} />

        {!!job.skills?.length && (
          <section className="mt-6">
            <h3 className="font-display text-sm font-bold text-charcoal">Skills</h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {job.skills.map((s) => (
                <Pill key={s}>{s}</Pill>
              ))}
            </div>
          </section>
        )}

        <ListSection title="Benefits" items={job.benefits} />

        {job.rating !== undefined && (
          <section className="mt-6 rounded-2xl bg-cream p-3.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-bold text-charcoal">
                <Star size={14} aria-hidden="true" className="fill-amber-400 text-amber-400" />
                {job.rating.toFixed(1)}
              </span>
              <span className="text-xs text-charcoal-soft">
                {job.reviewCount?.toLocaleString()} reviews
              </span>
            </div>
            <p className="mt-2 text-xs italic leading-relaxed text-charcoal/80">“{job.reviewExcerpt}”</p>
            <p className="mt-2 flex items-center gap-1 text-[11px] text-charcoal-soft">
              <BadgeCheck size={12} aria-hidden="true" /> Mock employee review data
            </p>
          </section>
        )}

        <p className="mt-6 text-center text-[11px] text-charcoal-soft">
          {job.source === 'live' ? 'Live Workday listing via team server' : 'Demo listing · fictional company'}
        </p>
      </div>
    </article>
  )
}
