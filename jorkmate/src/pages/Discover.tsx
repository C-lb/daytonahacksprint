import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { JOBS } from '../data/jobs'
import { matchScore, sortedDeck } from '../utils/matching'
import { JobCard } from '../components/JobCard'
import type { Job } from '../types'

const SWIPE_THRESHOLD = 110

function TopCard({
  job,
  match,
  onSwipe,
}: {
  job: Job
  match: number
  onSwipe: (dir: 'left' | 'right') => void
}) {
  const x = useMotionValue(0)
  const reduce = useReducedMotion()
  const rotate = useTransform(x, [-240, 240], reduce ? [0, 0] : [-9, 9])
  const skipOpacity = useTransform(x, [-140, -40], [1, 0])
  const applyOpacity = useTransform(x, [40, 140], [0, 1])

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate, touchAction: 'pan-y' }}
      drag="x"
      dragDirectionLock
      dragElastic={0.65}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -600) onSwipe('left')
        else if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > 600) onSwipe('right')
      }}
    >
      <JobCard job={job} match={match} />
      <motion.div
        aria-hidden="true"
        style={{ opacity: skipOpacity }}
        className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-xl border-4 border-charcoal bg-surface/85 px-4 py-1.5 text-2xl font-black tracking-widest text-charcoal"
      >
        SKIP
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: applyOpacity }}
        className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-xl border-4 border-coral bg-surface/85 px-4 py-1.5 text-2xl font-black tracking-widest text-coral"
      >
        APPLY
      </motion.div>
    </motion.div>
  )
}

export function Discover() {
  const { state, dispatch, showToast, live } = useApp()
  const [lastDir, setLastDir] = useState<'left' | 'right'>('right')
  const reduce = useReducedMotion()
  const profile = state.profile!

  const appliedIds = useMemo(() => new Set(state.applications.map((a) => a.jobId)), [state.applications])
  // live mode: Workday jobs from the team server (already excludes applied);
  // otherwise the ten seeded demo listings
  const deck = useMemo(() => {
    const source = live.enabled && live.jobs.length ? live.jobs : JOBS
    return sortedDeck(profile, source, state.settings.boostJobId).filter(
      (j) => !state.skippedJobs.includes(j.id) && !appliedIds.has(j.id),
    )
  }, [profile, live.enabled, live.jobs, state.skippedJobs, appliedIds, state.settings.boostJobId])

  const top = deck[0]

  function swipe(dir: 'left' | 'right') {
    if (!top) return
    setLastDir(dir)
    if (dir === 'left') {
      dispatch({ type: 'SKIP_JOB', jobId: top.id })
    } else if (top.source === 'live') {
      showToast('Application agent spawned')
      const liveJob = top
      live.swipeRight(top.id).then((ok) => {
        if (!ok) {
          // server hiccup: fall back to the local simulator so the demo never stalls
          dispatch({ type: 'APPLY', jobId: liveJob.id, now: Date.now(), job: liveJob })
        }
      })
    } else {
      dispatch({ type: 'APPLY', jobId: top.id, now: Date.now() })
      showToast('Application agent spawned')
    }
    if (state.settings.boostJobId === top.id) dispatch({ type: 'BOOST_JOB', jobId: null })
  }

  return (
    <div className="flex h-full flex-col bg-cream px-4 pt-3">
      <header className="mb-2 flex items-baseline justify-between px-1">
        <h1 className="font-display text-2xl font-bold text-charcoal">Discover</h1>
        <p className="text-xs text-charcoal-soft">{deck.length} roles waiting</p>
      </header>

      <div
        className="relative min-h-0 flex-1"
        role="region"
        aria-label="Job cards. Press left arrow to skip, right arrow to apply."
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') swipe('left')
          if (e.key === 'ArrowRight') swipe('right')
        }}
      >
        {/* stacked preview cards behind the top card */}
        {deck.slice(1, 3).map((j, i) => (
          <div
            key={j.id}
            aria-hidden="true"
            className="absolute inset-0 origin-bottom"
            style={{
              transform: `scale(${1 - 0.045 * (i + 1)}) translateY(${(i + 1) * 12}px)`,
              zIndex: -1 - i,
              filter: 'brightness(0.97)',
            }}
          >
            <div className="h-full rounded-3xl bg-surface raised" />
          </div>
        ))}

        <AnimatePresence>
          {top ? (
            <motion.div
              key={top.id}
              className="absolute inset-0"
              initial={reduce ? { opacity: 0 } : { scale: 0.955, y: 12, opacity: 0.9 }}
              animate={reduce ? { opacity: 1 } : { scale: 1, y: 0, opacity: 1 }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : {
                      x: lastDir === 'left' ? -560 : 560,
                      rotate: lastDir === 'left' ? -14 : 14,
                      opacity: 0,
                    }
              }
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <TopCard job={top} match={matchScore(profile, top)} onSwipe={swipe} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-charcoal/15 text-center"
            >
              <p className="font-display text-3xl font-bold text-charcoal">You’re all caught up.</p>
              <p className="mt-2 max-w-[240px] text-sm text-charcoal-soft">
                Every demo listing has been reviewed. Restore the deck to keep swiping.
              </p>
              <button
                type="button"
                onClick={() => dispatch({ type: 'RESTORE_DECK' })}
                className="mt-6 flex items-center gap-2 rounded-full bg-charcoal px-5 py-3 text-sm font-bold text-cream active:scale-95"
              >
                <RotateCcw size={16} aria-hidden="true" /> Restore demo deck
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {top && (
        <div className="flex items-center justify-center gap-6 pt-3 text-xs text-charcoal-soft">
          <span className="flex items-center gap-1.5">
            <ArrowLeft size={13} aria-hidden="true" /> Swipe to skip
          </span>
          <span className="flex items-center gap-1.5">
            Swipe to apply <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      )}
      <p className="pb-2 pt-2 text-center text-[10px] text-charcoal-soft">
        {live.enabled && live.jobs.length
          ? 'Live listings from the team server · applications run in a Daytona sandbox.'
          : 'Fictional listings and simulated submissions for demo purposes.'}
      </p>
    </div>
  )
}
