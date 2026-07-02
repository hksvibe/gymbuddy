import type { Felt } from '../lib/types'

interface Props {
  value: Felt | undefined
  onChange: (f: Felt) => void
}

const OPTIONS: { v: Felt; label: string; emoji: string; tint: string }[] = [
  { v: 'easy', label: 'Easy',  emoji: '💪', tint: 'border-success/30 bg-success/10 text-success-dark' },
  { v: 'ok',   label: 'OK',    emoji: '👍', tint: 'border-violet-deep/20 bg-lavender text-violet-deep' },
  { v: 'hard', label: 'Hard',  emoji: '😅', tint: 'border-amber-300 bg-amber-50 text-amber-800' },
  { v: 'pain', label: 'Pain',  emoji: '🚨', tint: 'border-red-300 bg-red-50 text-red-700' },
]

export default function FeltPrompt({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold text-ink mb-2">How did it feel?</p>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.v
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={`rounded-xl border-2 py-3 px-2 text-xs font-semibold flex flex-col items-center gap-1 transition ${
                active ? o.tint + ' ring-2 ring-offset-1 ring-violet-deep/40' : 'border-gray-200 bg-white text-ink-soft'
              }`}
            >
              <span className="text-lg leading-none">{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          )
        })}
      </div>
      {value === 'pain' && (
        <p className="mt-2 text-xs text-red-700">
          If pain persists, stop and consult a doctor. We&apos;ll swap this pattern next week.
        </p>
      )}
    </div>
  )
}
