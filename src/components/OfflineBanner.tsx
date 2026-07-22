import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// Small floating banner at the top when the browser reports offline. Non-blocking
// — reads and writes still work via the service-worker cache; this is just a heads-up.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null
  return (
    <div className="fixed top-0 inset-x-0 z-50 pointer-events-none flex justify-center pt-2 px-4">
      <div className="pointer-events-auto rounded-full bg-ink text-white text-xs font-semibold px-4 py-2 shadow-lg flex items-center gap-2">
        <WifiOff className="w-3.5 h-3.5" />
        You&apos;re offline · showing your cached plan
      </div>
    </div>
  )
}
