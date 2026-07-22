import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, ArrowRight, X } from 'lucide-react'

const KEY_PREFIX = 'gymbuddy.sundayRecap.dismissed.'

interface Props {
  weekNumber: number
  hasCheckIns: boolean
}

// Weekly nudge: if it's Sunday and the user has trained at least once this
// week, invite them to the Weekly Review + adaptive next-week regen.
// Deck reference: Journey 3 (page 17) — "'Here's how week 2 went'".
export default function SundayRecapBanner({ weekNumber, hasCheckIns }: Props) {
  const nav = useNavigate()
  const key = `${KEY_PREFIX}${weekNumber}`
  const [hidden, setHidden] = useState(() => localStorage.getItem(key) === '1')

  const isSunday = new Date().getDay() === 0
  if (!isSunday || hidden || !hasCheckIns) return null

  return (
    <div className="mx-6 mt-3 rounded-2xl bg-lavender border border-violet-deep/30 p-4 flex items-start gap-3">
      <CalendarCheck className="w-5 h-5 text-violet-deep flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-ink">
          Sunday recap ready — here&apos;s how Week {weekNumber} went.
        </p>
        <p className="text-xs text-ink-soft mt-1">
          Review the week and generate an adapted Week {weekNumber + 1}.
        </p>
        <button
          onClick={() => nav('/week')}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-deep"
        >
          Open weekly review <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={() => { localStorage.setItem(key, '1'); setHidden(true) }}
        className="text-ink-soft p-0.5"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
