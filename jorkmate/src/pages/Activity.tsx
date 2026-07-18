import { useMemo } from 'react'
import { AlertCircle, Bot, CheckCircle2, Eraser, FastForward, Loader2 } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { getJob } from '../data/jobs'
import { deriveAgentState } from '../services/agentSimulator'
import type { AgentEvent } from '../types'

function EventDot({ status }: { status: AgentEvent['status'] }) {
  if (status === 'complete')
    return <CheckCircle2 size={16} className="text-sage" aria-label="complete" />
  if (status === 'running')
    return <Loader2 size={16} className="animate-spin text-coral" aria-label="running" />
  if (status === 'action-required')
    return <AlertCircle size={16} className="text-coral-deep" aria-label="action required" />
  if (status === 'failed')
    return <AlertCircle size={16} className="text-charcoal" aria-label="failed" />
  return <span aria-label="waiting" className="mx-[3px] block h-2.5 w-2.5 rounded-full bg-charcoal/15" />
}

export function Activity() {
  const { state, dispatch, now, showToast } = useApp()

  const agents = useMemo(
    () =>
      state.applications
        .filter((a) => !a.clearedFromActivity)
        .map((app) => {
          const job = getJob(app.jobId)
          if (!job || !state.profile) return null
          return { app, job, derived: deriveAgentState(app, state.profile, job, now) }
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [state.applications, state.profile, now],
  )

  const anyActive = agents.some(
    (a) => a.derived.status === 'queued' || a.derived.status === 'running',
  )
  const anyComplete = agents.some((a) => a.derived.status === 'submitted')

  return (
    <div className="h-full overflow-y-auto bg-cream px-4 pb-6 pt-3">
      <header className="mb-3 flex items-start justify-between px-1">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal">Agent activity</h1>
          <p className="text-xs text-charcoal-soft">Live view of every application agent.</p>
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          disabled={!anyActive}
          onClick={() => {
            dispatch({ type: 'FAST_FORWARD', now: Date.now() })
            showToast('Active agents fast-forwarded')
          }}
          className="flex items-center gap-1.5 rounded-full bg-charcoal px-3.5 py-2 text-xs font-bold text-cream active:scale-95 disabled:opacity-40"
        >
          <FastForward size={14} aria-hidden="true" /> Fast-forward demo
        </button>
        <button
          type="button"
          disabled={!anyComplete}
          onClick={() => dispatch({ type: 'CLEAR_COMPLETED', now: Date.now() })}
          className="flex items-center gap-1.5 rounded-full border border-charcoal/20 bg-white px-3.5 py-2 text-xs font-bold text-charcoal active:scale-95 disabled:opacity-40"
        >
          <Eraser size={14} aria-hidden="true" /> Clear completed activity
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="mt-16 text-center">
          <Bot size={36} className="mx-auto text-charcoal/25" aria-hidden="true" />
          <p className="font-display mt-3 text-xl font-bold text-charcoal">No agent activity</p>
          <p className="mx-auto mt-1 max-w-[240px] text-sm text-charcoal-soft">
            Swipe right on a role and its agent will appear here in real time.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {agents.map(({ app, job, derived }) => (
            <li key={app.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-cream">
                    <Bot size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-charcoal">{app.agentId}</p>
                    <p className="text-xs text-charcoal-soft">
                      {job.title} · {job.company}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    derived.status === 'submitted'
                      ? 'bg-sage/15 text-sage'
                      : derived.status === 'action-required'
                        ? 'bg-coral-soft text-coral-deep'
                        : 'bg-cream-deep text-charcoal'
                  }`}
                >
                  {derived.status === 'submitted'
                    ? 'Submitted · Demo mode'
                    : derived.status === 'action-required'
                      ? 'Action required'
                      : derived.status === 'queued'
                        ? 'Queued'
                        : 'Running'}
                </span>
              </div>

              <ol className="relative space-y-0" aria-label={`Timeline for agent ${app.agentId}`}>
                {derived.events.map((ev, i) => (
                  <li key={ev.stage} className="relative flex gap-3 pb-3 last:pb-0">
                    {i < derived.events.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[7px] top-5 h-full w-0.5 ${
                          ev.status === 'complete' ? 'bg-sage/40' : 'bg-charcoal/10'
                        }`}
                      />
                    )}
                    <span className="relative z-10 mt-0.5 shrink-0 bg-white">
                      <EventDot status={ev.status} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-[13px] leading-tight ${
                          ev.status === 'waiting'
                            ? 'text-charcoal-soft'
                            : ev.status === 'action-required'
                              ? 'font-semibold text-coral-deep'
                              : 'font-medium text-charcoal'
                        }`}
                      >
                        {ev.label}
                      </p>
                      {ev.status !== 'waiting' && (
                        <p className="text-[11px] text-charcoal-soft">
                          {new Date(ev.at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {derived.status === 'action-required' && (
                <p className="mt-2 rounded-xl bg-coral-soft p-2.5 text-xs font-medium text-coral-deep">
                  Waiting on you — open Applications to answer the outstanding question.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
