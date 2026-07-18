import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-cream p-8 text-center">
          <p className="font-display text-2xl font-bold text-charcoal">Something wobbled.</p>
          <p className="mt-2 text-sm text-charcoal-soft">
            The demo hit an unexpected error. Reload to continue — your saved data is safe.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-coral px-6 py-3 font-semibold text-white active:scale-95"
          >
            Reload Jorkmate
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
