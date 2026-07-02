import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, LogIn, Loader2 } from 'lucide-react'
import { useAuthUser } from '../hooks/useAuthUser'
import { signInWithGoogle, signOutUser } from '../lib/auth'
import { firebaseConfigured } from '../lib/firebase'

// Compact "who am I" strip. Shows the signed-in Google account or the guest
// state. Sign-out clears data and returns to the Welcome screen; Google
// sign-in from guest state tries to link so guest data carries over.
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

  const isGuest = user.isAnonymous
  const initial = (user.displayName || user.email || 'G').trim().charAt(0).toUpperCase()

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-3 py-3 flex items-center gap-3">
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
      {isGuest && firebaseConfigured ? (
        <button
          onClick={upgrade}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-deep bg-lavender rounded-full px-3 py-1.5 disabled:opacity-50"
        >
          {busy === 'in' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
          Sign in
        </button>
      ) : (
        <button
          onClick={signOut}
          disabled={busy !== null}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink px-2 py-1.5 disabled:opacity-50"
          aria-label="Sign out"
        >
          {busy === 'out' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          Sign out
        </button>
      )}
      {error && (
        <div className="absolute right-0 -bottom-8 text-xs text-red-600">{error}</div>
      )}
    </div>
  )
}
