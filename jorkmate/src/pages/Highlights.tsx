import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Clock3, Flame, TrendingUp, Users } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { JOBS } from '../data/jobs'
import { matchScore } from '../utils/matching'
import { CompanyPanel } from '../components/CompanyPanel'
import { formatComp } from '../components/JobCard'
import type { Job } from '../types'

function HighlightRow({
  job,
  rank,
  applied,
  onOpen,
}: {
  job: Job
  rank: number
  applied: boolean
  onOpen: () => void
}) {
  const { state } = useApp()
  const match = matchScore(state.profile!, job)
  return (
    <li className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="font-display w-6 shrink-0 text-center text-lg font-bold text-charcoal-soft">
          {rank}
        </span>
        <CompanyPanel job={job} compact />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-charcoal">{job.title}</p>
          <p className="truncate text-xs text-charcoal-soft">
            {job.company} · {job.city}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-charcoal">{formatComp(job)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-charcoal-soft">
            <span className="font-bold text-coral">{match}% match</span>
            <span className="flex items-center gap-0.5">
              <TrendingUp size={11} aria-hidden="true" /> {job.popularity}
            </span>
            <span className="flex items-center gap-0.5">
              <Users size={11} aria-hidden="true" /> {job.applicants}
            </span>
            {job.closingInDays <= 10 && (
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
            className="flex shrink-0 items-center gap-1 rounded-full bg-coral px-3 py-2 text-xs font-bold text-white active:scale-95"
          >
            View <ArrowUpRight size={13} aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

function Section({
  title,
  icon,
  jobs,
  appliedIds,
  onOpen,
}: {
  title: string
  icon: React.ReactNode
  jobs: Job[]
  appliedIds: Set<string>
  onOpen: (id: string) => void
}) {
  if (!jobs.length) return null
  return (
    <section className="mb-6">
      <h2 className="font-display mb-2 flex items-center gap-2 text-lg font-bold text-charcoal">
        {icon} {title}
      </h2>
      <ol className="space-y-2">
        {jobs.map((j, i) => (
          <HighlightRow
            key={j.id}
            job={j}
            rank={i + 1}
            applied={appliedIds.has(j.id)}
            onOpen={() => onOpen(j.id)}
          />
        ))}
      </ol>
    </section>
  )
}

export function Highlights() {
  const { state, dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const appliedIds = useMemo(() => new Set(state.applications.map((a) => a.jobId)), [state.applications])

  const byPopularity = (list: Job[]) => [...list].sort((a, b) => b.popularity - a.popularity)
  const tech = byPopularity(JOBS.filter((j) => j.sector === 'tech')).slice(0, 4)
  const finance = byPopularity(JOBS.filter((j) => j.sector === 'finance')).slice(0, 4)
  const mostApplied = [...JOBS].sort((a, b) => b.applicants - a.applicants).slice(0, 4)
  const closingSoon = [...JOBS].sort((a, b) => a.closingInDays - b.closingInDays).slice(0, 4)

  function openInDiscover(jobId: string) {
    dispatch({ type: 'BOOST_JOB', jobId })
    showToast('Moved to the top of your deck')
    navigate('/app/discover')
  }

  return (
    <div className="h-full overflow-y-auto bg-cream px-4 pb-6 pt-3">
      <header className="mb-4 px-1">
        <h1 className="font-display text-2xl font-bold text-charcoal">Highlights</h1>
        <p className="text-xs text-charcoal-soft">
          Popular demo roles. Tap View to bring one to the top of Discover.
        </p>
      </header>
      <Section
        title="Trending in Tech"
        icon={<Flame size={18} className="text-coral" aria-hidden="true" />}
        jobs={tech}
        appliedIds={appliedIds}
        onOpen={openInDiscover}
      />
      <Section
        title="Hot in Finance"
        icon={<TrendingUp size={18} className="text-coral" aria-hidden="true" />}
        jobs={finance}
        appliedIds={appliedIds}
        onOpen={openInDiscover}
      />
      <Section
        title="Most Applied"
        icon={<Users size={18} className="text-coral" aria-hidden="true" />}
        jobs={mostApplied}
        appliedIds={appliedIds}
        onOpen={openInDiscover}
      />
      <Section
        title="Closing Soon"
        icon={<Clock3 size={18} className="text-coral" aria-hidden="true" />}
        jobs={closingSoon}
        appliedIds={appliedIds}
        onOpen={openInDiscover}
      />
      <p className="pb-2 text-center text-[10px] text-charcoal-soft">
        Fictional listings and simulated submissions for demo purposes.
      </p>
    </div>
  )
}
