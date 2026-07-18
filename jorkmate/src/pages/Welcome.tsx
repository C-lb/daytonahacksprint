import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Heart, Sparkles } from 'lucide-react'
import { useApp } from '../state/AppContext'
import { PERSONAS } from '../data/personas'
import { Field, TextInput } from '../components/ui'

type View = 'landing' | 'signup' | 'personas'

export function Welcome() {
  const { dispatch, showToast } = useApp()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('landing')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function submitSignup(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Enter your full name'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (form.password.length < 8) errs.password = 'At least 8 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    setErrors(errs)
    if (Object.keys(errs).length) return
    dispatch({ type: 'SIGN_UP', name: form.name.trim(), email: form.email.trim() })
    showToast('Demo account created')
    navigate('/onboarding')
  }

  function pickPersona(id: string) {
    dispatch({ type: 'SELECT_PERSONA', personaId: id })
    showToast('Demo profile loaded')
    navigate('/app/discover')
  }

  return (
    <div className="flex min-h-full flex-col bg-cream px-6 pb-8 pt-14" style={{ paddingTop: 'max(3.5rem, env(safe-area-inset-top))' }}>
      {view === 'landing' && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-1 flex-col"
        >
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-coral raised">
              <Heart size={30} className="fill-white text-white" aria-hidden="true" />
            </div>
            <h1 className="font-display mt-6 text-5xl font-bold tracking-tight text-charcoal">
              Jorkmate
            </h1>
            <p className="font-display mt-2 text-xl italic text-coral-deep">Meet your next move.</p>
            <p className="mt-6 max-w-[300px] text-[15px] leading-relaxed text-charcoal-soft">
              Tell us about yourself once. Then swipe through hand-picked roles, swipe right and a
              Jorkmate agent assembles and submits the application while you keep browsing.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => setView('signup')}
              className="w-full rounded-full bg-coral py-4 text-base font-bold text-white raised transition-transform active:scale-[0.98]"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => setView('personas')}
              className="w-full rounded-full border-2 border-charcoal/15 bg-surface py-3.5 text-base font-bold text-charcoal transition-transform active:scale-[0.98]"
            >
              Try a demo profile
            </button>
            <p className="pt-2 text-center text-xs leading-relaxed text-charcoal-soft">
              Browser-based demo. No real applications are submitted and your details stay in this
              browser.
            </p>
          </div>
        </motion.div>
      )}

      {view === 'signup' && (
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
          <button
            type="button"
            onClick={() => setView('landing')}
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-charcoal-soft"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <h2 className="font-display text-3xl font-bold text-charcoal">Create your account</h2>
          <p className="mb-6 mt-1 text-sm text-charcoal-soft">
            Demo only. Your details stay in this browser.
          </p>
          <form onSubmit={submitSignup} noValidate>
            <Field label="Full name" htmlFor="su-name">
              <TextInput
                id="su-name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors.name && <p className="mt-1 text-xs font-medium text-coral-deep">{errors.name}</p>}
            </Field>
            <Field label="Email" htmlFor="su-email">
              <TextInput
                id="su-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {errors.email && <p className="mt-1 text-xs font-medium text-coral-deep">{errors.email}</p>}
            </Field>
            <Field label="Password" htmlFor="su-pass">
              <TextInput
                id="su-pass"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && (
                <p className="mt-1 text-xs font-medium text-coral-deep">{errors.password}</p>
              )}
            </Field>
            <Field label="Confirm password" htmlFor="su-confirm">
              <TextInput
                id="su-confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
              {errors.confirm && (
                <p className="mt-1 text-xs font-medium text-coral-deep">{errors.confirm}</p>
              )}
            </Field>
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-coral py-4 text-base font-bold text-white raised active:scale-[0.98]"
            >
              Continue to onboarding
            </button>
            <p className="mt-3 text-center text-xs text-charcoal-soft">
              Simulated sign-up, no real authentication, nothing leaves your device.
            </p>
          </form>
        </motion.div>
      )}

      {view === 'personas' && (
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}>
          <button
            type="button"
            onClick={() => setView('landing')}
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-charcoal-soft"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back
          </button>
          <h2 className="font-display text-3xl font-bold text-charcoal">Pick a persona</h2>
          <p className="mb-6 mt-1 text-sm text-charcoal-soft">
            Fully onboarded demo profiles, jump straight to swiping.
          </p>
          <div className="space-y-3">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPersona(p.id)}
                className="w-full overflow-hidden rounded-2xl bg-surface text-left raised transition-transform active:scale-[0.98]"
              >
                <div
                  className="h-2"
                  style={{ background: `linear-gradient(90deg, ${p.accent[0]}, ${p.accent[1]})` }}
                />
                <div className="flex items-start gap-3 p-4">
                  <div
                    aria-hidden="true"
                    className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${p.accent[0]}, ${p.accent[1]})` }}
                  >
                    {p.profile.personal.fullName
                      .split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-charcoal">
                      {p.profile.personal.fullName}
                    </p>
                    <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-coral">
                      <Sparkles size={12} aria-hidden="true" /> {p.tagline}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-charcoal-soft">{p.blurb}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
