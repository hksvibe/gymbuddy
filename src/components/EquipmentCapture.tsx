import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import PhotoUpload from './PhotoUpload'
import { EQUIPMENT_CATALOG, emojiFor, labelFor } from '../data/equipment'
import { detectEquipment } from '../lib/api'
import type { Equipment } from '../lib/types'

interface Props {
  value: Equipment[]
  onChange: (next: Equipment[]) => void
}

// Manual chip selection + optional photo snap that auto-detects equipment
// via the Groq vision Cloud Function. Detected items are merged with the
// user's manual picks; the user still has final say via the chips.
export default function EquipmentCapture({ value, onChange }: Props) {
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [scannedAt, setScannedAt] = useState<number | null>(null)

  function toggle(id: Equipment) {
    const has = value.includes(id)
    onChange(has ? value.filter((e) => e !== id) : [...value, id])
  }

  async function onPhotosUploaded(urls: string[]) {
    setPhotoUrls(urls)
    if (urls.length === 0) return
    setScanning(true)
    try {
      const detected = await detectEquipment(urls)
      const merged = Array.from(new Set([...value, ...detected]))
      onChange(merged)
      setScannedAt(Date.now())
    } catch (e) {
      console.warn('detectEquipment failed', e)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div>
      {/* Photo snap — optional */}
      <div className="rounded-2xl bg-white border border-gray-100 p-3.5 mb-4">
        <p className="text-sm font-semibold text-ink">Snap your gym (optional)</p>
        <p className="text-xs text-ink-soft mt-0.5">
          Photo of the rack works fastest — we&apos;ll detect what&apos;s in it.
        </p>
        <div className="mt-3">
          <PhotoUpload onPhotosUploaded={onPhotosUploaded} existingUrls={photoUrls} />
        </div>
        {scanning && (
          <p className="mt-3 text-sm text-violet-deep flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Detecting equipment…
          </p>
        )}
        {scannedAt && !scanning && (
          <p className="mt-3 text-sm text-success-dark flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Detected — review + edit below.
          </p>
        )}
      </div>

      {/* Manual chips */}
      <p className="text-sm font-semibold text-ink">Tick everything you have access to</p>
      <p className="text-xs text-ink-soft mt-0.5">
        We&apos;ll only prescribe exercises you can actually do.
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
