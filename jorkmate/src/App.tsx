import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppProvider, useApp } from './state/AppContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BottomNav } from './components/BottomNav'
import { Toasts } from './components/Toasts'
import { Welcome } from './pages/Welcome'
import { Onboarding } from './pages/Onboarding'
import { Discover } from './pages/Discover'
import { Highlights } from './pages/Highlights'
import { Applications } from './pages/Applications'
import { ProfilePage } from './pages/ProfilePage'

/** Desktop: phone-width shell. Mobile: full viewport. */
function Shell() {
  return (
    <div className="flex min-h-dvh justify-center bg-[#0a0a0b] md:py-6">
      <div className="relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-cream shadow-2xl shadow-black/60 md:h-[calc(100dvh-3rem)] md:rounded-[2.2rem] md:border md:border-white/10">
        <Toasts />
        <Outlet />
      </div>
    </div>
  )
}

function RequireSession() {
  const { state } = useApp()
  if (!state.session) return <Navigate to="/" replace />
  if (!state.session.onboarded) return <Navigate to="/onboarding" replace />
  if (!state.profile) return <Navigate to="/" replace />
  return (
    <>
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}

function RequireSignupOnly() {
  const { state } = useApp()
  if (!state.session) return <Navigate to="/" replace />
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <Outlet />
    </main>
  )
}

function WelcomeGate() {
  const { state } = useApp()
  // returning users stay signed in after refresh
  if (state.session?.onboarded && state.profile) return <Navigate to="/app/discover" replace />
  if (state.session && !state.session.onboarded) return <Navigate to="/onboarding" replace />
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <Welcome />
    </main>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<WelcomeGate />} />
              <Route element={<RequireSignupOnly />}>
                <Route path="/onboarding" element={<Onboarding />} />
              </Route>
              <Route element={<RequireSession />}>
                <Route path="/app/discover" element={<Discover />} />
                <Route path="/app/highlights" element={<Highlights />} />
                <Route path="/app/applications" element={<Applications />} />
                <Route path="/app/activity" element={<Navigate to="/app/applications" replace />} />
                <Route path="/app/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </AppProvider>
    </ErrorBoundary>
  )
}
