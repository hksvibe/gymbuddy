import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Loader2 } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import { loadProfile } from '../lib/storage'
import { signInWithGoogle } from '../lib/auth'
import { useAuthUser } from '../hooks/useAuthUser'

export default function Welcome() {
  const nav = useNavigate()
  const { user, loading } = useAuthUser()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If we already have a signed-in user + a profile, jump straight to Today.
  useEffect(() => {
    if (loading) return
    if (!user) return
    loadProfile().then((p) => {
      if (p) nav('/today', { replace: true })
      else nav('/onboarding', { replace: true })
    })
  }, [user, loading, nav])

  async function doGoogle() {
    setBusy(true); setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      const msg = String((e as { message?: string }).message ?? e)
      setError(msg.includes('popup') ? 'Sign-in cancelled.' : 'Google sign-in failed. Try again?')
      setBusy(false)
    }
  }

  return (
    <MobileShell>
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-12">
        <div />
        <div className="text-center">
          <div className="w-20 h-20 rounded-3xl bg-violet-deep flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-deep/30">
            <Dumbbell className="w-10 h-10 text-white" strokeWidth={2.4} />
          </div>
          <h1 className="text-3xl font-extrabold text-ink leading-tight">
            Your free<br/>gym coach.
          </h1>
          <p className="mt-4 text-ink-soft text-base leading-relaxed px-2">
            A personalized weekly plan, demo videos for every exercise, and a 10-second check-in. Built for beginners.
          </p>
        </div>

        <div className="w-full space-y-3">
          <GoogleButton onClick={doGoogle} loading={busy} />
          {error && (
            <p className="text-center text-xs text-red-600 mt-1">{error}</p>
          )}
          <p className="text-center text-xs text-gray-400 mt-2">
            Sign in with Google to save your progress across devices.
          </p>
        </div>
      </div>
    </MobileShell>
  )
}

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full rounded-2xl bg-ink text-white text-base font-semibold py-4 px-5 transition active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.99.66-2.25 1.05-3.72 1.05-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.08a6.6 6.6 0 0 1 0-4.17V7.06H2.18a11 11 0 0 0 0 9.87l3.66-2.85z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.85C6.7 7.32 9.13 5.38 12 5.38z"/>
        </svg>
      )}
      {loading ? 'Signing in…' : 'Continue with Google'}
    </button>
  )
}
