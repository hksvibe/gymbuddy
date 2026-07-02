import { useState } from 'react'
import { X, Scale, Ruler } from 'lucide-react'
import PrimaryButton from './PrimaryButton'
import { saveMeasurement } from '../lib/storage'
import type { Measurement } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (m: Measurement) => void
  seedFromLatest?: Measurement | null
}

interface Draft {
  weight_kg: string
  waist_cm: string
  chest_cm: string
  arms_cm: string
  thighs_cm: string
  hips_cm: string
  body_fat_pct: string
  notes: string
}

const empty: Draft = {
  weight_kg: '', waist_cm: '', chest_cm: '', arms_cm: '',
  thighs_cm: '', hips_cm: '', body_fat_pct: '', notes: '',
}

export default function MeasurementForm({ open, onClose, onSaved, seedFromLatest }: Props) {
  const [draft, setDraft] = useState<Draft>(empty)
  const [saving, setSaving] = useState(false)
  const [showMore, setShowMore] = useState(false)

  if (!open) return null

  function num(s: string): number | undefined {
    const n = Number(s)
    return s.trim() && !Number.isNaN(n) && n > 0 ? n : undefined
  }

  async function submit() {
    setSaving(true)
    try {
      const saved = await saveMeasurement({
        weight_kg: num(draft.weight_kg),
        waist_cm: num(draft.waist_cm),
        chest_cm: num(draft.chest_cm),
        arms_cm: num(draft.arms_cm),
        thighs_cm: num(draft.thighs_cm),
        hips_cm: num(draft.hips_cm),
        body_fat_pct: num(draft.body_fat_pct),
        notes: draft.notes.trim() || undefined,
      })
      onSaved(saved)
      setDraft(empty)
      setShowMore(false)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const anyValue = Object.entries(draft).some(([k, v]) => k !== 'notes' && v.trim())

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white px-6 pt-5 pb-3 flex items-center justify-between border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-violet-deep uppercase tracking-wider">Track today</p>
            <h2 className="text-xl font-bold text-ink mt-0.5">Log your measurements</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <X className="w-5 h-5 text-ink-soft" />
          </button>
        </div>

        <div className="px-6 py-5">
          {seedFromLatest && (
            <p className="text-xs text-ink-soft mb-4">
              Last logged {timeAgo(seedFromLatest.logged_at)}. Only fill in what you took today.
            </p>
          )}

          {/* Weight — primary */}
          <NumberField
            icon={Scale}
            label="Weight"
            unit="kg"
            step="0.1"
            value={draft.weight_kg}
            onChange={(v) => setDraft({ ...draft, weight_kg: v })}
            placeholder="e.g. 78.4"
            hint={seedFromLatest?.weight_kg ? `Last: ${seedFromLatest.weight_kg} kg` : undefined}
          />

          {/* Tape measurements */}
          <div className="mt-3">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="text-sm font-medium text-violet-deep flex items-center gap-1"
            >
              <Ruler className="w-4 h-4" />
              {showMore ? 'Hide' : 'Add'} tape measurements
              <span className={`transition ${showMore ? 'rotate-180' : ''}`}>▾</span>
            </button>
          </div>

          {showMore && (
            <div className="mt-3 space-y-3">
              <NumberField label="Waist" unit="cm" value={draft.waist_cm} onChange={(v) => setDraft({ ...draft, waist_cm: v })}
                placeholder="e.g. 87" hint={seedFromLatest?.waist_cm ? `Last: ${seedFromLatest.waist_cm} cm` : undefined} />
              <NumberField label="Chest" unit="cm" value={draft.chest_cm} onChange={(v) => setDraft({ ...draft, chest_cm: v })}
                placeholder="e.g. 102" hint={seedFromLatest?.chest_cm ? `Last: ${seedFromLatest.chest_cm} cm` : undefined} />
              <NumberField label="Arms (relaxed)" unit="cm" value={draft.arms_cm} onChange={(v) => setDraft({ ...draft, arms_cm: v })}
                placeholder="e.g. 34" hint={seedFromLatest?.arms_cm ? `Last: ${seedFromLatest.arms_cm} cm` : undefined} />
              <NumberField label="Thighs" unit="cm" value={draft.thighs_cm} onChange={(v) => setDraft({ ...draft, thighs_cm: v })}
                placeholder="e.g. 56" hint={seedFromLatest?.thighs_cm ? `Last: ${seedFromLatest.thighs_cm} cm` : undefined} />
              <NumberField label="Hips" unit="cm" value={draft.hips_cm} onChange={(v) => setDraft({ ...draft, hips_cm: v })}
                placeholder="e.g. 96" hint={seedFromLatest?.hips_cm ? `Last: ${seedFromLatest.hips_cm} cm` : undefined} />
              <NumberField label="Body fat" unit="%" value={draft.body_fat_pct} onChange={(v) => setDraft({ ...draft, body_fat_pct: v })}
                placeholder="e.g. 22" step="0.1" hint={seedFromLatest?.body_fat_pct ? `Last: ${seedFromLatest.body_fat_pct}%` : undefined} />
            </div>
          )}

          {/* Notes */}
          <label className="block mt-4">
            <span className="text-sm font-medium text-ink-soft">Notes (optional)</span>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="e.g. slept 7h, ate less rice yesterday"
              rows={2}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-ink text-sm focus:border-violet-deep focus:outline-none resize-none"
            />
          </label>

          <div className="mt-6">
            <PrimaryButton onClick={submit} disabled={!anyValue} loading={saving}>
              {saving ? 'Saving…' : 'Save entry'}
            </PrimaryButton>
            {!anyValue && (
              <p className="text-center text-xs text-ink-soft mt-2">
                Enter at least one value to save.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NumberField({
  icon: Icon, label, unit, value, onChange, placeholder, hint, step,
}: {
  icon?: typeof Scale
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  step?: string
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-soft flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </span>
        {hint && <span className="text-xs text-ink-soft">{hint}</span>}
      </div>
      <div className="mt-1.5 relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder={placeholder}
          inputMode="decimal"
          step={step}
          className="w-full rounded-xl border border-gray-200 pl-4 pr-12 py-2.5 text-ink focus:border-violet-deep focus:outline-none"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-soft font-medium">
          {unit}
        </span>
      </div>
    </label>
  )
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`
  return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`
}
