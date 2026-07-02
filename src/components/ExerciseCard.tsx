import { Play, Check, X, Repeat, AlertCircle } from 'lucide-react'
import type { Exercise } from '../lib/types'
import { emojiFor } from '../data/equipment'

interface Props {
  exercise: Exercise
  status: 'pending' | 'done' | 'skipped'
  onToggleDone: () => void
  onToggleSkip: () => void
  onWatchDemo: () => void
  onSwap?: () => void
}

export default function ExerciseCard({
  exercise, status, onToggleDone, onToggleSkip, onWatchDemo, onSwap,
}: Props) {
  return (
    <div
      className={`rounded-2xl border-2 px-4 py-4 transition ${
        status === 'done'
          ? 'border-success/30 bg-success/5'
          : status === 'skipped'
          ? 'border-gray-200 bg-gray-50 opacity-70'
          : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink leading-snug">{exercise.name}</h3>
          <div className="mt-1 text-sm text-ink-soft">
            <span className="font-medium text-ink">{exercise.sets}</span>
            <span className="text-ink-soft"> sets × </span>
            <span className="font-medium text-ink">{exercise.reps}</span>
            <span className="text-ink-soft"> · RPE {exercise.rpe}</span>
          </div>
          {exercise.uses_equipment && exercise.uses_equipment.length > 0 && (
            <div className="mt-1.5 text-xs text-ink-soft flex flex-wrap gap-1">
              {exercise.uses_equipment.map((eq) => (
                <span key={eq} className="bg-lavender text-violet-deep rounded-full px-2 py-0.5">
                  {emojiFor(eq)} {eq.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={onToggleSkip}
            aria-label="Skip exercise"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              status === 'skipped'
                ? 'bg-gray-300 text-gray-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleDone}
            aria-label="Mark done"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              status === 'done'
                ? 'bg-success text-white'
                : 'bg-lavender text-violet-deep hover:bg-lavender-deep'
            }`}
          >
            <Check className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
      </div>

      <p className="mt-2.5 text-sm text-ink-soft italic leading-snug">
        {exercise.why}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          onClick={onWatchDemo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-deep hover:text-violet-bright"
        >
          <Play className="w-4 h-4 fill-current" />
          Watch demo
        </button>
        {onSwap && (
          <button
            onClick={onSwap}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <Repeat className="w-4 h-4" />
            Swap
          </button>
        )}
      </div>

      <details className="mt-3 group">
        <summary className="text-xs text-ink-soft cursor-pointer list-none flex items-center gap-1">
          <span className="underline underline-offset-2">Form cue</span>
          <span className="group-open:rotate-180 transition">▾</span>
        </summary>
        <p className="mt-2 text-xs text-ink-soft leading-relaxed">
          {exercise.form_cue}
        </p>
        <p className="mt-2 text-xs text-amber-700 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
          Stop if you feel sharp pain.
        </p>
      </details>
    </div>
  )
}
