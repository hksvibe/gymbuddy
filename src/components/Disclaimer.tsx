import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'

const KEY = 'gymbuddy.disclaimer.dismissed'

export default function Disclaimer() {
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1')
  if (hidden) return null
  return (
    <div className="mx-6 mt-3 rounded-2xl bg-lavender border border-violet-deep/20 px-4 py-3 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-violet-deep mt-0.5 flex-shrink-0" />
      <p className="text-xs text-ink-soft leading-relaxed flex-1">
        GymBuddy gives general fitness guidance, not medical advice. Stop if you feel pain and consult a doctor if you have a health condition.
      </p>
      <button
        onClick={() => { localStorage.setItem(KEY, '1'); setHidden(true) }}
        className="text-ink-soft p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
