import { useRef, useState } from 'react'
import { Camera, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { uploadEquipmentPhoto } from '../lib/storage'

interface Props {
  onPhotosUploaded: (urls: string[]) => void
  existingUrls?: string[]
}

export default function PhotoUpload({ onPhotosUploaded, existingUrls = [] }: Props) {
  const cameraInput = useRef<HTMLInputElement>(null)
  const libInput = useRef<HTMLInputElement>(null)
  const [urls, setUrls] = useState<string[]>(existingUrls)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const newUrls: string[] = []
      for (const f of Array.from(files)) {
        const url = await uploadEquipmentPhoto(f)
        newUrls.push(url)
      }
      const merged = [...urls, ...newUrls]
      setUrls(merged)
      onPhotosUploaded(merged)
    } finally {
      setUploading(false)
    }
  }

  function removePhoto(idx: number) {
    const next = urls.filter((_, i) => i !== idx)
    setUrls(next)
    onPhotosUploaded(next)
  }

  return (
    <div>
      <input
        ref={cameraInput} type="file" accept="image/*" capture="environment"
        multiple onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={libInput} type="file" accept="image/*"
        multiple onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => cameraInput.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-violet-deep/30 bg-lavender py-4 text-violet-deep hover:bg-lavender-deep disabled:opacity-50"
        >
          <Camera className="w-5 h-5" />
          <span className="text-sm font-semibold">Take photo</span>
        </button>
        <button
          onClick={() => libInput.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-violet-deep/30 bg-lavender py-4 text-violet-deep hover:bg-lavender-deep disabled:opacity-50"
        >
          <ImageIcon className="w-5 h-5" />
          <span className="text-sm font-semibold">From gallery</span>
        </button>
      </div>

      {uploading && (
        <p className="mt-3 text-xs text-ink-soft flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
        </p>
      )}

      {urls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {urls.map((u, i) => (
            <div key={i} className="relative flex-shrink-0">
              <img
                src={u}
                alt={`Gym photo ${i + 1}`}
                className="w-20 h-20 rounded-xl object-cover border border-gray-200"
              />
              <button
                onClick={() => removePhoto(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center"
                aria-label="Remove photo"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
