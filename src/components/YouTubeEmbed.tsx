import { useEffect, useState } from 'react'
import { X, Play, ExternalLink } from 'lucide-react'
import { resolveVideo } from '../lib/api'
import { updatePlanExerciseVideo } from '../lib/storage'

interface Props {
  exerciseName: string
  searchQuery: string
  cachedVideoId: string | null
  planId: string
  open: boolean
  onClose: () => void
}

// Resolves a video_id (caches it on the plan), renders an embedded player.
// Falls back to a YouTube-search link in a new tab if the API call returns nothing.
export default function YouTubeEmbed({
  exerciseName, searchQuery, cachedVideoId, planId, open, onClose,
}: Props) {
  const [videoId, setVideoId] = useState<string | null>(cachedVideoId)
  const [resolving, setResolving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open) return
    if (videoId) return
    let cancelled = false
    setResolving(true)
    setFailed(false)
    resolveVideo(searchQuery).then(async (id) => {
      if (cancelled) return
      if (id) {
        setVideoId(id)
        await updatePlanExerciseVideo(planId, exerciseName, id).catch(() => {})
      } else {
        setFailed(true)
      }
    }).finally(() => {
      if (!cancelled) setResolving(false)
    })
    return () => { cancelled = true }
  }, [open, videoId, searchQuery, planId, exerciseName])

  if (!open) return null

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex-1 truncate">
          <p className="text-xs text-white/60 uppercase tracking-wider">Demo</p>
          <p className="text-sm font-semibold truncate">{exerciseName}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10" aria-label="Close">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-3">
        <div className="w-full max-w-[480px] aspect-video bg-black rounded-xl overflow-hidden">
          {videoId ? (
            <iframe
              key={videoId}
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
              title={exerciseName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/70 text-sm gap-3">
              {resolving ? (
                <>
                  <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <p>Finding the right demo…</p>
                </>
              ) : failed ? (
                <>
                  <Play className="w-8 h-8" />
                  <p>Demo couldn&apos;t auto-play here.</p>
                  <a
                    href={searchUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-white underline"
                  >
                    Open on YouTube <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 text-center">
        <a
          href={searchUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs text-white/60 underline"
        >
          See more demos on YouTube
        </a>
      </div>
    </div>
  )
}
