// Google Sign-in + Guest (Anonymous) + anon→Google account linking.

import {
  GoogleAuthProvider, signInWithPopup, signInAnonymously,
  signOut as fbSignOut, linkWithPopup, onAuthStateChanged, type User,
} from 'firebase/auth'
import { auth, firebaseConfigured } from './firebase'

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  isAnonymous: boolean
}

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
    isAnonymous: u.isAnonymous,
  }
}

const LOCAL_UID_KEY = 'gymbuddy.localUid'
const LOCAL_GUEST_MODE_KEY = 'gymbuddy.localGuest'

function localGuestUser(): AuthUser {
  let uid = localStorage.getItem(LOCAL_UID_KEY)
  if (!uid) {
    uid = 'local_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(LOCAL_UID_KEY, uid)
  }
  return { uid, email: null, displayName: 'Guest', photoURL: null, isAnonymous: true }
}

// The "current" user: real Firebase user if signed in, or a local guest UID
// (Firebase off OR Anonymous auth not available on the project).
export function currentUser(): AuthUser | null {
  if (firebaseConfigured && auth?.currentUser) return toAuthUser(auth.currentUser)
  return localStorage.getItem(LOCAL_GUEST_MODE_KEY) === '1' ? localGuestUser() : null
}

// Local-guest UIDs are prefixed so storage can decide whether to hit Firestore
// or fall back to localStorage without needing an extra Firebase auth roundtrip.
export function isLocalGuestUid(uid: string): boolean {
  return uid.startsWith('local_')
}

// Subscribe to changes. Returns an unsubscribe function.
export function subscribeAuth(cb: (u: AuthUser | null) => void): () => void {
  if (!firebaseConfigured || !auth) {
    // Poll localStorage flag to react to guest-mode changes.
    let last = currentUser()
    cb(last)
    const iv = setInterval(() => {
      const cur = currentUser()
      if (JSON.stringify(cur) !== JSON.stringify(last)) {
        last = cur
        cb(cur)
      }
    }, 300)
    return () => clearInterval(iv)
  }
  return onAuthStateChanged(auth, (u) => cb(u ? toAuthUser(u) : null))
}

// Explicit guest sign-in. Tries Firebase Anonymous first; falls back to a
// local-only guest UID if anon auth isn't enabled on the Firebase project
// (or Firebase isn't configured at all). Either way the user gets a UID
// and the app is fully usable.
export async function signInAsGuest(): Promise<AuthUser> {
  if (firebaseConfigured && auth) {
    try {
      const cred = await signInAnonymously(auth)
      return toAuthUser(cred.user)
    } catch (e) {
      console.warn('Firebase anonymous auth unavailable; falling back to local guest', e)
    }
  }
  localStorage.setItem(LOCAL_GUEST_MODE_KEY, '1')
  return localGuestUser()
}

// Google sign-in. If the user is currently anonymous, tries to link the Google
// credential to preserve their guest data. Falls back to a fresh Google sign-in
// (accepting data loss) if the Google account is already in use elsewhere.
export async function signInWithGoogle(): Promise<AuthUser> {
  if (!firebaseConfigured || !auth) {
    throw new Error('Firebase not configured — Google sign-in unavailable in local-only mode.')
  }
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      const cred = await linkWithPopup(current, provider)
      return toAuthUser(cred.user)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        // The Google account is already registered — sign in with it directly.
        // Guest data stays in Firestore under the old anon UID but becomes unreachable.
        const cred = await signInWithPopup(auth, provider)
        return toAuthUser(cred.user)
      }
      throw err
    }
  }
  const cred = await signInWithPopup(auth, provider)
  return toAuthUser(cred.user)
}

export async function signOutUser(): Promise<void> {
  localStorage.removeItem(LOCAL_GUEST_MODE_KEY)
  localStorage.removeItem(LOCAL_UID_KEY)
  if (firebaseConfigured && auth) {
    await fbSignOut(auth)
  }
}
