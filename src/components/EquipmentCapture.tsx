import { EQUIPMENT_CATALOG, emojiFor, labelFor } from '../data/equipment'
import type { Equipment } from '../lib/types'

interface Props {
  value: Equipment[]
  onChange: (next: Equipment[]) => void
}

// Manual chip-based equipment selection. Photo capture was removed in favour
// of a simpler, more predictable picker — users tap what they have.
export default function EquipmentCapture({ value, onChange }: Props) {
  function toggle(id: Equipment) {
    const has = value.includes(id)
    onChange(has ? value.filter((e) => e !== id) : [...value, id])
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink">Tick everything you have access to</p>
      <p className="text-xs text-ink-soft mt-0.5">
        We&apos;ll only prescribe exercises you can actually do. You can update this from My Gym anytime.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {EQUIPMENT_CATALOG.map((e) => {
          const active = value.includes(e.id)
          return (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              className={`rounded-full px-3.5 py-2 text-sm font-medium border-2 transition flex items-center gap-1.5 ${
                active
                  ? 'border-violet-deep bg-violet-deep text-white'
                  : 'border-gray-200 bg-white text-ink hover:border-gray-300'
              }`}
            >
              <span>{e.emoji}</span>
              <span>{e.label}</span>
            </button>
          )
        })}
      </div>

      {value.length > 0 && (
        <div className="mt-5 rounded-2xl bg-lavender border border-violet-deep/15 p-3">
          <p className="text-xs font-semibold text-violet-deep mb-1.5">
            {value.length} confirmed
          </p>
          <p className="text-sm text-ink leading-relaxed">
            {value.map((id) => `${emojiFor(id)} ${labelFor(id)}`).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
