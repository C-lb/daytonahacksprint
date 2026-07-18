import { AnimatePresence, motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useApp } from '../state/AppContext'

export function Toasts() {
  const { toasts } = useApp()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sm font-medium text-cream shadow-lg"
          >
            <Bot size={16} className="text-coral" aria-hidden="true" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
