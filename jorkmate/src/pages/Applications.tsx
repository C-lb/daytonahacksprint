import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  Eraser,
  FastForward,
  Loader2,
  XCircle,
} from 'lucide-react'
import { useApp } from '../state/AppContext'
import { getJob } from '../data/jobs'
import { deriveAgentState, SUBMITTED_STAGE } from '../services/agentSimulator'
import type { Application, DerivedAgentState, Job, LiveApplication } from '../types'
import { inputCls } from '../components/ui'
import { CompanyPanel } from '../components/CompanyPanel'

type Tab = 'active' | 'submitted' | 'action'
type ChipStatus = DerivedAgentState['status'] | 'applying' | 'failed'

function StatusChip({ status, live }: { status: ChipStatus; live?: boolean }) {
  if (status === 'submitted')
    return (
      <span className="flex items-center gap-1 rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-bold text-sage">
        <CheckCircle2 size={12} aria-hidden="true" /> {live ? 'Submitted · Live' : 'Submitted · Demo mode'}
      </span>
    )
  if (status === 'action-required')
    return (
      <span className="flex items-center gap-1 rounded-full bg-coral-soft px-2.5 py-1 text-[11px] font-bold text-coral-deep">
        <AlertCircle size={12} aria-hidden="true" /> Action required
      </span>
    )
  if (status === 'failed')
    return (
      <span className="flex items-center gap-1 rounded-full bg-charcoal/10 px-2.5 py-1 text-[11px] font-bold text-charcoal">
        <XCircle size={12} aria-hidden="true" /> Failed
      </span>
    )
  return (
    <span className="flex items-center gap-1 rounded-full bg-cream-deep px-2.5 py-1 text-[11px] font-bold text-charcoal">
      <Loader2 size={12} className="animate-spin" aria-hidden="true" />
      {status === 'queued' ? 'Queued' : 'Agent working'}
    </span>
  )
}

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`
}

const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** Simulated (local) application: package + derived agent timeline. */
function ApplicationCard({ app, job }: { app: Application; job: Job }) {
  const { state, dispatch, now, showToast } = useApp()
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState('')
  const derived = deriveAgentState(app, state.profile!, job, now)
  const progress = Math.round((Math.min(derived.stage, SUBMITTED_STAGE) / SUBMITTED_STAGE) * 100)

  function resume(e: React.FormEvent) {
    e.preventDefault()
    if (!derived.pending || !answer.trim()) return
    dispatch({
      type: 'RESUME_APPLICATION',
      appId: app.id,
      key: derived.pending.key,
      answer: answer.trim(),
      now: Date.now(),
    })
    setAnswer('')
    showToast('Agent resumed with your answer')
  }

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full p-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <CompanyPanel job={job} compact />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-charcoal">{job.title}</p>
            <p className="truncate text-xs text-charcoal-soft">
              {job.company} · {job.city} · {timeAgo(app.createdAt, now)}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusChip status={derived.status} />
              <span className="rounded-full border border-charcoal/15 px-2 py-0.5 text-[10px] font-semibold text-charcoal-soft">
                {app.agentId}
              </span>
              <span className="rounded-full border border-charcoal/15 px-2 py-0.5 text-[10px] font-semibold text-charcoal-soft">
                Demo
              </span>
            </div>
          </div>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-charcoal-soft transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
        <div
          className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-cream-deep"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Application progress"
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              derived.status === 'action-required' ? 'bg-coral' : derived.status === 'submitted' ? 'bg-sage' : 'bg-charcoal'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-charcoal/10 px-4 pb-4 pt-3 text-sm">
              {derived.pending && (
                <form onSubmit={resume} className="mb-4 rounded-xl bg-coral-soft p-3">
                  <p className="flex items-start gap-1.5 text-[13px] font-semibold text-coral-deep">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {derived.pending.question}
                  </p>
                  <input
                    aria-label="Your answer"
                    className={`${inputCls} mt-2`}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your explicit answer"
                  />
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-full bg-coral py-2.5 text-sm font-bold text-white active:scale-[0.98]"
                  >
                    Answer and resume agent
                  </button>
                </form>
              )}

              <h4 className="font-display font-bold text-charcoal">Tailored résumé summary</h4>
              <p className="mt-1 leading-relaxed text-charcoal/85">{app.pkg.resumeSummary}</p>

              <h4 className="font-display mt-4 font-bold text-charcoal">Cover note</h4>
              <p className="mt-1 whitespace-pre-line leading-relaxed text-charcoal/85">{app.pkg.coverNote}</p>

              <h4 className="font-display mt-4 font-bold text-charcoal">Standard answers</h4>
              <dl className="mt-1 space-y-1">
                {app.pkg.standardAnswers.map((a) => (
                  <div key={a.label} className="flex justify-between gap-3">
                    <dt className="shrink-0 text-charcoal-soft">{a.label}</dt>
                    <dd className="break-words text-right font-medium text-charcoal">{a.value}</dd>
                  </div>
                ))}
              </dl>

              <h4 className="font-display mt-4 font-bold text-charcoal">Screening questions</h4>
              <ul className="mt-1 space-y-2">
                {app.pkg.screeningAnswers.map((s) => (
                  <li key={s.question}>
                    <p className="text-charcoal-soft">{s.question}</p>
                    <p className="font-medium text-charcoal">
                      {s.answer}
                      {s.sensitive && (
                        <span className="ml-1.5 rounded-full bg-cream-deep px-1.5 py-0.5 text-[10px] font-semibold text-charcoal-soft">
                          explicit answer only
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>

              <h4 className="font-display mt-4 font-bold text-charcoal">Agent timeline</h4>
              <ol className="mt-2 space-y-1.5">
                {derived.events.map((ev) => (
                  <li key={ev.stage} className="flex items-center gap-2 text-[13px]">
                    {ev.status === 'complete' ? (
                      <CheckCircle2 size={14} className="shrink-0 text-sage" aria-hidden="true" />
                    ) : ev.status === 'running' ? (
                      <Loader2 size={14} className="shrink-0 animate-spin text-coral" aria-hidden="true" />
                    ) : ev.status === 'action-required' ? (
                      <AlertCircle size={14} className="shrink-0 text-coral-deep" aria-hidden="true" />
                    ) : (
                      <span className="mx-[3px] h-2 w-2 shrink-0 rounded-full bg-charcoal/20" aria-hidden="true" />
                    )}
                    <span className={ev.status === 'waiting' ? 'text-charcoal-soft' : 'text-charcoal'}>
                      {ev.label}
                    </span>
                    {ev.status !== 'waiting' && (
                      <span className="ml-auto text-[11px] text-charcoal-soft">{fmtTime(ev.at)}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** Live application: real Daytona/Workday pipeline steps streamed from the team server. */
function LiveCard({ app, job }: { app: LiveApplication; job: Job | undefined }) {
  const { now } = useApp()
  const [open, setOpen] = useState(false)
  const steps = app.steps.filter((s) => !s.message.startsWith('status:'))
  const screenshotSrc = app.screenshot
    ? /^(data:|https?:|\/)/.test(app.screenshot)
      ? app.screenshot
      : `data:image/png;base64,${app.screenshot}`
    : null

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="w-full p-3.5 text-left">
        <div className="flex items-center gap-3">
          {job ? (
            <CompanyPanel job={job} compact />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal text-cream">
              <Bot size={20} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-charcoal">{job?.title ?? 'Workday listing'}</p>
            <p className="truncate text-xs text-charcoal-soft">
              {job?.company ?? app.jobId} · {timeAgo(app.createdAt, now)}
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatusChip status={app.status === 'applying' ? 'running' : app.status} live />
              <span className="rounded-full border border-coral/40 px-2 py-0.5 text-[10px] font-semibold text-coral-deep">
                Live · Daytona
              </span>
            </div>
          </div>
          <ChevronDown
            size={18}
            aria-hidden="true"
            className={`shrink-0 text-charcoal-soft transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-charcoal/10 px-4 pb-4 pt-3 text-sm">
              <h4 className="font-display font-bold text-charcoal">Pipeline steps</h4>
              {steps.length === 0 ? (
                <p className="mt-1 text-charcoal-soft">Waiting for the first agent event…</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {steps.map((s, i) => (
                    <li key={`${s.t}-${i}`} className="flex items-start gap-2 text-[13px]">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-sage" aria-hidden="true" />
                      <span className="min-w-0 break-words text-charcoal">{s.message}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-charcoal-soft">{fmtTime(s.t)}</span>
                    </li>
                  ))}
                </ol>
              )}
              {screenshotSrc && (
                <img
                  src={screenshotSrc}
                  alt="Latest screenshot from the apply agent"
                  className="mt-3 w-full rounded-xl border border-charcoal/10"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function Applications() {
  const { state, dispatch, now, showToast, live } = useApp()
  const [tab, setTab] = useState<Tab>('active')

  const localRows = useMemo(() => {
    return state.applications
      .filter((a) => !a.clearedFromActivity)
      .map((app) => {
        const job = getJob(app.jobId) ?? live.jobIndex[app.jobId]
        if (!job || !state.profile) return null
        return { app, job, derived: deriveAgentState(app, state.profile, job, now) }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
  }, [state.applications, state.profile, now, live.jobIndex])

  const bucket = (s: string) =>
    s === 'queued' || s === 'running' || s === 'applying'
      ? 'active'
      : s === 'submitted'
        ? 'submitted'
        : 'action'

  const filteredLocal = localRows.filter((r) => bucket(r.derived.status) === tab)
  const filteredLive = live.apps.filter((a) => bucket(a.status) === tab)

  const counts: Record<Tab, number> = { active: 0, submitted: 0, action: 0 }
  localRows.forEach((r) => counts[bucket(r.derived.status) as Tab]++)
  live.apps.forEach((a) => counts[bucket(a.status) as Tab]++)

  const anySimActive = localRows.some(
    (r) => r.derived.status === 'queued' || r.derived.status === 'running',
  )
  const anySimComplete = localRows.some((r) => r.derived.status === 'submitted')

  const TABS: { id: Tab; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'action', label: 'Action required' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-cream px-4 pb-6 pt-3">
      <header className="mb-3 px-1">
        <h1 className="font-display text-2xl font-bold text-charcoal">Applications</h1>
        <p className="text-xs text-charcoal-soft">
          {live.enabled
            ? 'Live agents run on the team server; simulated agents run in-browser.'
            : 'Every submission is simulated — demo mode.'}
        </p>
      </header>

      <div role="tablist" aria-label="Filter applications" className="mb-3 flex gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
              tab === t.id ? 'bg-charcoal text-cream' : 'bg-white text-charcoal-soft hover:text-charcoal'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && <span className="ml-1.5 opacity-70">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          disabled={!anySimActive}
          onClick={() => {
            dispatch({ type: 'FAST_FORWARD', now: Date.now() })
            showToast('Simulated agents fast-forwarded')
          }}
          className="flex items-center gap-1.5 rounded-full bg-charcoal px-3.5 py-2 text-xs font-bold text-cream active:scale-95 disabled:opacity-40"
        >
          <FastForward size={14} aria-hidden="true" /> Fast-forward demo
        </button>
        <button
          type="button"
          disabled={!anySimComplete}
          onClick={() => dispatch({ type: 'CLEAR_COMPLETED', now: Date.now() })}
          className="flex items-center gap-1.5 rounded-full border border-charcoal/20 bg-white px-3.5 py-2 text-xs font-bold text-charcoal active:scale-95 disabled:opacity-40"
        >
          <Eraser size={14} aria-hidden="true" /> Clear completed
        </button>
      </div>

      {filteredLocal.length === 0 && filteredLive.length === 0 ? (
        <div className="mt-16 text-center">
          <Bot size={36} className="mx-auto text-charcoal/25" aria-hidden="true" />
          <p className="font-display mt-3 text-xl font-bold text-charcoal">
            {tab === 'active'
              ? 'No agents working right now'
              : tab === 'submitted'
                ? 'Nothing submitted yet'
                : 'Nothing needs your attention'}
          </p>
          <p className="mx-auto mt-1 max-w-[240px] text-sm text-charcoal-soft">
            Swipe right in Discover to spawn an application agent.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredLive.map((a) => (
            <LiveCard key={a.id} app={a} job={live.jobIndex[a.jobId]} />
          ))}
          {filteredLocal.map((r) => (
            <ApplicationCard key={r.app.id} app={r.app} job={r.job} />
          ))}
        </ul>
      )}
    </div>
  )
}
