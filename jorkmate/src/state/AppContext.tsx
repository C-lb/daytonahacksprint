/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Application, Job, LiveApplication, Session, Settings, UserProfile } from '../types'
import { KEYS, clearAll, load, save } from '../utils/storage'
import { getJob } from '../data/jobs'
import { PERSONAS } from '../data/personas'
import { generateApplicationPackage } from '../services/applicationPackage'
import {
  deriveAgentState,
  fastForwardedApplication,
  resumedApplication,
} from '../services/agentSimulator'
import { detectServer, fetchApplications, fetchDeck, swipe as apiSwipe } from '../services/api'

export interface AppState {
  session: Session | null
  profile: UserProfile | null
  applications: Application[]
  skippedJobs: string[]
  settings: Settings
}

export type Action =
  | { type: 'SIGN_UP'; name: string; email: string }
  | { type: 'SELECT_PERSONA'; personaId: string }
  | { type: 'SAVE_PROFILE'; profile: UserProfile }
  | { type: 'COMPLETE_ONBOARDING'; profile: UserProfile }
  | { type: 'SKIP_JOB'; jobId: string }
  | { type: 'APPLY'; jobId: string; now: number; job?: Job }
  | { type: 'RESUME_APPLICATION'; appId: string; key: string; answer: string; now: number }
  | { type: 'FAST_FORWARD'; now: number }
  | { type: 'CLEAR_COMPLETED'; now: number }
  | { type: 'RESTORE_DECK' }
  | { type: 'BOOST_JOB'; jobId: string | null }
  | { type: 'SIGN_OUT' }
  | { type: 'RESET_DEMO' }

export function initialState(): AppState {
  return {
    session: load<Session | null>(KEYS.session, null),
    profile: load<UserProfile | null>(KEYS.profile, null),
    applications: load<Application[]>(KEYS.applications, []),
    skippedJobs: load<string[]>(KEYS.skippedJobs, []),
    settings: load<Settings>(KEYS.settings, { agentCounter: 2048, boostJobId: null }),
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SIGN_UP':
      return {
        ...state,
        session: {
          name: action.name,
          email: action.email,
          personaId: null,
          onboarded: false,
          createdAt: Date.now(),
        },
      }
    case 'SELECT_PERSONA': {
      const persona = PERSONAS.find((p) => p.id === action.personaId)
      if (!persona) return state
      return {
        ...state,
        session: {
          name: persona.profile.personal.fullName,
          email: persona.profile.personal.email,
          personaId: persona.id,
          onboarded: true,
          createdAt: Date.now(),
        },
        profile: persona.profile,
      }
    }
    case 'SAVE_PROFILE':
      return { ...state, profile: action.profile }
    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        profile: action.profile,
        session: state.session ? { ...state.session, onboarded: true } : state.session,
      }
    case 'SKIP_JOB':
      if (state.skippedJobs.includes(action.jobId)) return state
      return { ...state, skippedJobs: [...state.skippedJobs, action.jobId] }
    case 'APPLY': {
      const job = action.job ?? getJob(action.jobId)
      if (!job || !state.profile) return state
      if (state.applications.some((a) => a.jobId === action.jobId)) return state
      const app: Application = {
        id: `app-${action.now}-${action.jobId}`,
        jobId: action.jobId,
        profileId: state.profile.id,
        agentId: `JM-${state.settings.agentCounter}`,
        createdAt: action.now,
        startedAt: action.now,
        extraAnswers: {},
        pkg: generateApplicationPackage(state.profile, job),
        clearedFromActivity: false,
      }
      return {
        ...state,
        applications: [app, ...state.applications],
        settings: { ...state.settings, agentCounter: state.settings.agentCounter + 1 },
      }
    }
    case 'RESUME_APPLICATION': {
      return {
        ...state,
        applications: state.applications.map((a) => {
          if (a.id !== action.appId) return a
          const resumed = resumedApplication(a, action.key, action.answer, action.now)
          const job = getJob(a.jobId)
          // regenerate package so the provided answer appears in screening answers
          return job && state.profile
            ? { ...resumed, pkg: generateApplicationPackage(state.profile, job, resumed.extraAnswers) }
            : resumed
        }),
      }
    }
    case 'FAST_FORWARD':
      return {
        ...state,
        applications: state.applications.map((a) => fastForwardedApplication(a, action.now)),
      }
    case 'CLEAR_COMPLETED': {
      if (!state.profile) return state
      return {
        ...state,
        applications: state.applications.map((a) => {
          const job = getJob(a.jobId)
          if (!job) return a
          const derived = deriveAgentState(a, state.profile!, job, action.now)
          return derived.status === 'submitted' ? { ...a, clearedFromActivity: true } : a
        }),
      }
    }
    case 'RESTORE_DECK':
      return { ...state, skippedJobs: [] }
    case 'BOOST_JOB':
      // boosting a previously skipped job also returns it to the deck
      return {
        ...state,
        settings: { ...state.settings, boostJobId: action.jobId },
        skippedJobs: action.jobId
          ? state.skippedJobs.filter((id) => id !== action.jobId)
          : state.skippedJobs,
      }
    case 'SIGN_OUT':
      return { ...state, session: null }
    case 'RESET_DEMO':
      clearAll()
      return {
        session: null,
        profile: null,
        applications: [],
        skippedJobs: [],
        settings: { agentCounter: 2048, boostJobId: null },
      }
    default:
      return state
  }
}

interface Toast {
  id: number
  message: string
}

/** Live mode: the team server (Workday jobs via Oxylabs, Daytona apply pipeline) is up. */
interface LiveState {
  enabled: boolean
  jobs: Job[]
  apps: LiveApplication[]
  jobIndex: Record<string, Job>
  swipeRight: (jobId: string) => Promise<boolean>
}

interface AppContextValue {
  state: AppState
  dispatch: (action: Action) => void
  now: number
  toasts: Toast[]
  showToast: (message: string) => void
  live: LiveState
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)
  const [now, setNow] = useState(() => Date.now())
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)
  const [liveEnabled, setLiveEnabled] = useState(false)
  const [liveJobs, setLiveJobs] = useState<Job[]>([])
  const [liveApps, setLiveApps] = useState<LiveApplication[]>([])
  // applied jobs drop out of /api/deck, so remember every live job ever seen
  const [liveJobIndex, setLiveJobIndex] = useState<Record<string, Job>>(() =>
    load(KEYS.liveJobIndex, {}),
  )
  useEffect(() => save(KEYS.liveJobIndex, liveJobIndex), [liveJobIndex])

  // Detect the team server once; while it's up, poll deck + applications.
  // Steps are persisted server-side into applications.json on every emitStep,
  // so polling GET /api/applications carries full timelines — no SSE needed here.
  useEffect(() => {
    let cancelled = false
    detectServer().then((up) => !cancelled && setLiveEnabled(up))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!liveEnabled) return
    let cancelled = false
    const refresh = () => {
      fetchDeck()
        .then((j) => {
          if (cancelled) return
          setLiveJobs(j)
          setLiveJobIndex((idx) => ({ ...idx, ...Object.fromEntries(j.map((x) => [x.id, x])) }))
        })
        .catch(() => {})
      fetchApplications().then((a) => !cancelled && setLiveApps(a)).catch(() => {})
    }
    refresh()
    const id = window.setInterval(refresh, 2500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [liveEnabled])

  useEffect(() => save(KEYS.session, state.session), [state.session])
  useEffect(() => save(KEYS.profile, state.profile), [state.profile])
  useEffect(() => save(KEYS.applications, state.applications), [state.applications])
  useEffect(() => save(KEYS.skippedJobs, state.skippedJobs), [state.skippedJobs])
  useEffect(() => save(KEYS.settings, state.settings), [state.settings])

  // One clock for every agent: tick only while something can still change.
  const hasLiveAgents = useMemo(() => {
    if (!state.profile) return false
    return state.applications.some((a) => {
      const job = getJob(a.jobId)
      if (!job) return false
      const s = deriveAgentState(a, state.profile!, job, Date.now())
      return s.status === 'queued' || s.status === 'running'
    })
  }, [state.applications, state.profile, now])

  useEffect(() => {
    if (!hasLiveAgents) return
    const id = window.setInterval(() => setNow(Date.now()), 400)
    return () => window.clearInterval(id)
  }, [hasLiveAgents])

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      dispatch: (action: Action) => {
        dispatch(action)
        setNow(Date.now())
      },
      now,
      toasts,
      showToast: (message: string) => {
        const id = ++toastId.current
        setToasts((t) => [...t, { id, message }])
        window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
      },
      live: {
        enabled: liveEnabled,
        jobs: liveJobs,
        apps: liveApps,
        jobIndex: liveJobIndex,
        // returns false on failure so the caller can fall back to the local simulator
        swipeRight: async (jobId: string) => {
          try {
            await apiSwipe(jobId, 'right')
            setLiveJobs((jobs) => jobs.filter((j) => j.id !== jobId)) // optimistic; poll confirms
            return true
          } catch {
            return false
          }
        },
      },
    }),
    [state, now, toasts, liveEnabled, liveJobs, liveApps, liveJobIndex],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
