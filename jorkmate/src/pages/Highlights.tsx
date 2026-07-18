import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock3, Search, TrendingUp, Users } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { JOBS } from '../data/jobs'
import { matchScore } from '../utils/matching'
import { CompanyPanel } from '../components/CompanyPanel'
import { formatComp } from '../components/JobCard'
import type { Job } from '../types'

type SortKey = 'match' | 'salary' | 'applicants' | 'closing'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'match', label: 'Best match' },
  { key: 'salary', label: 'Salary' },
  { key: 'applicants', label: 'Most applied' },
  { key: 'closing', label: 'Closing soon' },
]

const salaryOf = (j: Job) => j.compMax ?? j.compMin ?? 0

function HighlightRow({
  job,
  match,
  rank,
  applied,
  onOpen,
}: {
  job: Job
  match: number
  rank: number
  applied: boolean
  onOpen: () => void
}) {
  return (
    <li className="rounded-2xl bg-surface p-3 raised">
      <div className="flex items-center gap-3">
        <span className="font-display w-6 shrink-0 text-center text-base font-bold text-charcoal-soft">
          {rank}
        </span>
        <CompanyPanel job={job} compact />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-charcoal">{job.title}</p>
          <p className="truncate text-xs text-charcoal-soft">
            {job.company} · {job.city}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-charcoal">{formatComp(job)}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-charcoal-soft">
            <span className="font-bold text-coral">{match}% match</span>
            {job.applicants !== undefined && (
              <span className="flex items-center gap-0.5">
                <Users size={11} aria-hidden="true" /> {job.applicants}
              </span>
            )}
            {job.closingInDays !== undefined && job.closingInDays <= 10 && (
              <span className="flex items-center gap-0.5 font-semibold text-coral-deep">
                <Clock3 size={11} aria-hidden="true" /> {job.closingInDays}d left
              </span>
            )}
          </div>
        </div>
        {applied ? (
          <span className="shrink-0 rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-bold text-sage">
            Applied
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Open ${job.title} at ${job.company} in Discover`}
            onClick={onOpen}
            className="flex shrink-0 items-center gap-1 rounded-full bg-coral px-3 py-2 text-xs font-bold text-white transition-transform hover:bg-coral-deep active:scale-95"
          >
            View <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

export function Highlights() {
  const { state, dispatch, showToast, live } = useApp()
  const navigate = useNavigate()
  const profile = state.profile!
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('match')

  const appliedIds = useMemo(() => new Set(state.applications.map((a) => a.jobId)), [state.applications])

  // live mode: Workday jobs from the team server; otherwise the seeded demo listings
  const source = live.enabled && live.jobs.length ? live.jobs : JOBS
  const scoreOf = (j: Job) => j.match?.score ?? matchScore(profile, j)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? source.filter((j) =>
          [j.title, j.company, j.city, j.country, ...(j.categories ?? [])]
            .filter(Boolean)
            .some((f) => f!.toLowerCase().includes(q)),
        )
      : [...source]
    const sorters: Record<SortKey, (a: Job, b: Job) => number> = {
      match: (a, b) => scoreOf(b) - scoreOf(a),
      salary: (a, b) => salaryOf(b) - salaryOf(a),
      applicants: (a, b) => (b.applicants ?? 0) - (a.applicants ?? 0),
      closing: (a, b) => (a.closingInDays ?? 999) - (b.closingInDays ?? 999),
    }
    return filtered.sort(sorters[sortBy])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, query, sortBy, profile])

  function openInDiscover(jobId: string) {
    dispatch({ type: 'BOOST_JOB', jobId })
    showToast('Moved to the top of your deck')
    navigate('/app/discover')
  }

  return (
    <div className="flex h-full flex-col bg-cream">
      {/* sticky search + sort header */}
      <div className="shrink-0 px-4 pt-3">
        <header className="mb-3 px-1">
          <h1 className="font-display text-2xl font-bold text-charcoal">Highlights</h1>
          <p className="text-xs text-charcoal-soft">
            Search and sort every role. Tap View to bring one to the top of Discover.
          </p>
        </header>

        <label className="relative block">
          <Search
            size={16}
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-soft"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, company, or location"
            aria-label="Search roles"
            className="w-full rounded-xl bg-surface py-2.5 pl-10 pr-3.5 text-sm text-charcoal placeholder:text-charcoal-soft raised focus:outline-none focus:ring-2 focus:ring-coral/40"
          />
        </label>

        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Sort roles">
          {SORTS.map(({ key, label }) => {
            const active = sortBy === key
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setSortBy(key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-coral-soft text-coral-deep ring-1 ring-coral/30'
                    : 'bg-surface text-charcoal-soft raised hover:text-charcoal'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* scrollable results */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-2" data-scrollable>
        <p className="mb-2 px-1 text-[11px] text-charcoal-soft">
          {rows.length} {rows.length === 1 ? 'role' : 'roles'}
        </p>
        {rows.length ? (
          <ol className="space-y-2">
            {rows.map((j, i) => (
              <HighlightRow
                key={j.id}
                job={j}
                match={scoreOf(j)}
                rank={i + 1}
                applied={appliedIds.has(j.id)}
                onOpen={() => openInDiscover(j.id)}
              />
            ))}
          </ol>
        ) : (
          <div className="mt-16 flex flex-col items-center gap-2 text-center">
            <TrendingUp size={22} aria-hidden="true" className="text-charcoal-soft" />
            <p className="text-sm text-charcoal-soft">No roles match “{query}”.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-full bg-surface px-4 py-2 text-xs font-semibold text-charcoal raised hover:text-coral"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
