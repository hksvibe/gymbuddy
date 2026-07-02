import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import PhotoUpload from './PhotoUpload'
import { EQUIPMENT_CATALOG, emojiFor, labelFor } from '../data/equipment'
import { detectEquipment } from '../lib/api'
import type { Equipment, EquipmentSource } from '../lib/types'

interface Props {
  value: Equipment[]
  source: EquipmentSource
  photoUrls: string[]
  onChange: (next: { equipment: Equipment[]; source: EquipmentSource; photoUrls: string[] }) => void
}

export default function EquipmentCapture({ value, source, photoUrls, onChange }: Props) {
  const [scanning, setScanning] = useState(false)
  const [scannedAt, setScannedAt] = useState<number | null>(null)

  function toggle(id: Equipment) {
    const has = value.includes(id)
    const nextEq = has ? value.filter((e) => e !== id) : [...value, id]
    onChange({
      equipment: nextEq,
      source: photoUrls.length > 0 ? 'both' : 'manual',
      photoUrls,
    })
  }

  async function onPhotosUploaded(urls: string[]) {
    if (urls.length === 0) {
      onChange({ equipment: value, source: 'manual', photoUrls: [] })
      return
    }
    setScanning(true)
    try {
      const detected = await detectEquipment(urls)
      const merged = Array.from(new Set([...value, ...detected]))
      onChange({
        equipment: merged,
        source: 'photo',
        photoUrls: urls,
      })
      setScannedAt(Date.now())
    } finally {
      setScanning(false)
    }
  }

  return (
    <div>
      <div className="rounded-2xl bg-white border border-gray-100 p-4">
        <p className="text-sm font-semibold text-ink">Snap your gym</p>
        <p className="text-xs text-ink-soft mt-0.5">
          Photo of the rack works fastest — we&apos;ll detect the equipment for you.
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
            Detected — review and edit below.
          </p>
        )}
      </div>

      <p className="mt-5 text-sm font-semibold text-ink">Or pick manually</p>
      <p className="text-xs text-ink-soft mt-0.5">Tap everything available at your gym.</p>
      <div className="mt-3 flex flex-wrap gap-2">
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

      <p className="text-xs text-ink-soft italic mt-3">
        Source: {source}{photoUrls.length > 0 && ` · ${photoUrls.length} photo${photoUrls.length > 1 ? 's' : ''}`}
      </p>
    </div>
  )
}
