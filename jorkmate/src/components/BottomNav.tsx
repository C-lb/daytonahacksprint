import { NavLink } from 'react-router-dom'
import { Activity, Flame, Layers, Sparkles, UserRound } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { deriveAgentState } from '../services/agentSimulator'
import { getJob } from '../data/jobs'

const TABS = [
  { to: '/app/discover', label: 'Discover', icon: Sparkles },
  { to: '/app/highlights', label: 'Highlights', icon: Flame },
  { to: '/app/applications', label: 'Applications', icon: Layers },
  { to: '/app/activity', label: 'Activity', icon: Activity },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  const { state, now } = useApp()
  const derived = state.profile
    ? state.applications.map((a) => {
        const job = getJob(a.jobId)
        return job ? deriveAgentState(a, state.profile!, job, now) : null
      })
    : []
  const actionRequired = derived.filter((d) => d?.status === 'action-required').length
  const running = derived.filter((d) => d?.status === 'running' || d?.status === 'queued').length

  return (
    <nav
      aria-label="Main navigation"
      className="shrink-0 border-t border-charcoal/10 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {TABS.map(({ to, label, icon: Icon }) => {
          const badge =
            label === 'Applications' ? actionRequired : label === 'Activity' ? running : 0
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-coral' : 'text-charcoal-soft hover:text-charcoal'
                }`
              }
            >
              <span className="relative">
                <Icon size={22} aria-hidden="true" />
                {badge > 0 && (
                  <span
                    aria-label={`${badge} ${label === 'Activity' ? 'agents running' : 'needing attention'}`}
                    className={`absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                      label === 'Applications' ? 'bg-coral' : 'bg-sage pulse-dot'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </span>
              {label}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
