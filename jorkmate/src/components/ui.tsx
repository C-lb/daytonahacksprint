import type { ReactNode } from 'react'

export function Field({
  label,
  children,
  optional,
  htmlFor,
}: {
  label: string
  children: ReactNode
  optional?: boolean
  htmlFor?: string
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-charcoal">
        {label}
        {optional && <span className="ml-1 font-normal text-charcoal-soft">(optional)</span>}
      </label>
      {children}
    </div>
  )
}

export const inputCls =
  'w-full rounded-xl border border-charcoal/15 bg-white px-3.5 py-2.5 text-[15px] text-charcoal placeholder:text-charcoal-soft/60 focus:border-coral focus:outline-none'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

/** Multi-select chip group used across onboarding. */
export function ChipGroup({
  options,
  selected,
  onToggle,
  label,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors active:scale-95 ${
              active
                ? 'border-coral bg-coral text-white'
                : 'border-charcoal/20 bg-white text-charcoal hover:border-coral/50'
            }`}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

/** Free-text tag editor (skills, tools, languages). */
export function TagInput({
  tags,
  onChange,
  placeholder,
  label,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
  label: string
}) {
  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-3 py-1 text-sm font-medium text-coral-deep"
          >
            {t}
            <button
              type="button"
              aria-label={`Remove ${t}`}
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="ml-0.5 text-coral-deep/70 hover:text-coral-deep"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        aria-label={label}
        placeholder={placeholder}
        className={inputCls}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const v = e.currentTarget.value.trim().replace(/,$/, '')
            if (v && !tags.includes(v)) onChange([...tags, v])
            e.currentTarget.value = ''
          }
        }}
        onBlur={(e) => {
          const v = e.currentTarget.value.trim()
          if (v && !tags.includes(v)) onChange([...tags, v])
          e.currentTarget.value = ''
        }}
      />
      <p className="mt-1 text-xs text-charcoal-soft">Press Enter to add</p>
    </div>
  )
}

export function TriStateSelect({
  value,
  onChange,
  label,
}: {
  value: 'yes' | 'no' | 'prefer-not-to-say' | null
  onChange: (v: 'yes' | 'no' | 'prefer-not-to-say') => void
  label: string
}) {
  const opts: { v: 'yes' | 'no' | 'prefer-not-to-say'; text: string }[] = [
    { v: 'yes', text: 'Yes' },
    { v: 'no', text: 'No' },
    { v: 'prefer-not-to-say', text: 'Prefer not to say' },
  ]
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === o.v
              ? 'border-charcoal bg-charcoal text-cream'
              : 'border-charcoal/20 bg-white text-charcoal'
          }`}
        >
          {o.text}
        </button>
      ))}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-charcoal/10 bg-white px-4 py-3"
    >
      <span className="text-[15px] font-medium text-charcoal">{label}</span>
      <span
        className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-coral' : 'bg-charcoal/20'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  )
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-display mb-3 text-lg font-bold text-charcoal">{title}</h3>
      {children}
    </section>
  )
}
