import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, LogIn, Loader2 } from 'lucide-react'
import { useAuthUser } from '../hooks/useAuthUser'
import { signInWithGoogle, signOutUser } from '../lib/auth'
import { firebaseConfigured } from '../lib/firebase'

// Compact "who am I" strip. Shows the signed-in Google account or the guest
// state. Sign-out is ALWAYS available — even genuine guests can use it to
// clear their local session and re-land on the Welcome screen.
export default function IdentityStrip() {
  const nav = useNavigate()
  const { user } = useAuthUser()
  const [busy, setBusy] = useState<null | 'in' | 'out'>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function upgrade() {
    setBusy('in'); setError(null)
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign-in failed.')
    } finally {
      setBusy(null)
    }
  }

  async function signOut() {
    setBusy('out')
    try {
      await signOutUser()
      nav('/', { replace: true })
    } finally {
      setBusy(null)
    }
  }

  // Belt-and-braces: a user with an email is NEVER a guest, regardless of
  // any stale isAnonymous flag Firebase may still be carrying around.
  const isGuest = user.isAnonymous && !user.email && !user.displayName
  const initial = (user.displayName || user.email || 'G').trim().charAt(0).toUpperCase()

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-lavender text-violet-deep font-bold">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            : <span>{initial}</span>}
        </div>
        <div className="flex-1 min-w-0">
          {isGuest ? (
            <>
              <p className="text-sm font-semibold text-ink">Guest mode</p>
              <p className="text-xs text-ink-soft">Your progress is on this device only.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink truncate">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              {user.email && (
                <p className="text-xs text-ink-soft truncate">{user.email}</p>
              )}
            </>
          )}
        </div>
        <button
          onClick={signOut}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 disabled:opacity-50"
          aria-label="Sign out"
        >
          {busy === 'out' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Sign out
        </button>
      </div>

      {/* Extra CTA for genuine guests to upgrade to Google in-place */}
      {isGuest && firebaseConfigured && (
        <button
          onClick={upgrade}
          disabled={busy !== null}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-violet-deep bg-lavender rounded-xl px-4 py-2.5 hover:bg-lavender-deep disabled:opacity-50 transition"
        >
          {busy === 'in' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Sign in with Google to sync across devices
        </button>
      )}

      {error && (
        <p className="mt-2 text-center text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
