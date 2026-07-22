import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'

const KEY = 'gymbuddy.firstSessionNudge.dismissed'

interface Props {
  show: boolean       // caller decides — typically: fresh profile, no check-ins yet, week 1
}

// Day-1 hint per the deck's hypothesis: reduce the friction of the first
// session. "Start with just one exercise" reframes the check-in as an
// action, not a full workout commitment.
export default function FirstSessionNudge({ show }: Props) {
  const [hidden, setHidden] = useState(() => localStorage.getItem(KEY) === '1')
  if (!show || hidden) return null

  return (
    <div className="mx-6 mt-3 rounded-2xl bg-gradient-to-br from-violet-deep to-violet-bright text-white p-4 flex items-start gap-3 shadow-lg shadow-violet-deep/20">
      <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-bold">New to the gym? Start with just one exercise.</p>
        <p className="text-xs text-white/85 mt-1 leading-relaxed">
          Any check-in counts. Warm-up + one movement + walk out is a win. The habit is what matters — the rest builds from there.
        </p>
      </div>
      <button
        onClick={() => { localStorage.setItem(KEY, '1'); setHidden(true) }}
        className="text-white/70 p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
