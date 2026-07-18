import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AppProvider, useApp } from '../state/AppContext'
import { deriveAgentState } from '../services/agentSimulator'
import { getJob } from '../data/jobs'

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>

describe('right-swipe apply flow', () => {
  beforeEach(() => localStorage.clear())

  it('creates an application with an agent run on APPLY', () => {
    const { result } = renderHook(() => useApp(), { wrapper })

    act(() => result.current.dispatch({ type: 'SELECT_PERSONA', personaId: 'persona-ari' }))
    act(() => result.current.dispatch({ type: 'APPLY', jobId: 'job-boogle', now: 42_000 }))

    const apps = result.current.state.applications
    expect(apps).toHaveLength(1)
    expect(apps[0].jobId).toBe('job-boogle')
    expect(apps[0].agentId).toBe('JM-2048')
    expect(apps[0].startedAt).toBe(42_000)
    expect(apps[0].pkg.resumeSummary).toContain('Ari Tan')
    expect(apps[0].pkg.coverNote.length).toBeGreaterThan(100)

    // the agent run is live and derivable
    const derived = deriveAgentState(
      apps[0],
      result.current.state.profile!,
      getJob('job-boogle')!,
      42_100,
    )
    expect(['queued', 'running']).toContain(derived.status)
  })

  it('does not create duplicate applications for the same job', () => {
    const { result } = renderHook(() => useApp(), { wrapper })
    act(() => result.current.dispatch({ type: 'SELECT_PERSONA', personaId: 'persona-ari' }))
    act(() => result.current.dispatch({ type: 'APPLY', jobId: 'job-boogle', now: 1 }))
    act(() => result.current.dispatch({ type: 'APPLY', jobId: 'job-boogle', now: 2 }))
    expect(result.current.state.applications).toHaveLength(1)
  })

  it('persists applications so a refresh rehydrates them', () => {
    const first = renderHook(() => useApp(), { wrapper })
    act(() => first.result.current.dispatch({ type: 'SELECT_PERSONA', personaId: 'persona-ari' }))
    act(() => first.result.current.dispatch({ type: 'APPLY', jobId: 'job-atlas', now: 7_000 }))
    first.unmount()

    // fresh provider = simulated page reload reading from localStorage
    const second = renderHook(() => useApp(), { wrapper })
    expect(second.result.current.state.applications).toHaveLength(1)
    expect(second.result.current.state.applications[0].startedAt).toBe(7_000)
  })
})
