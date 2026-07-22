// Google Sign-in + Guest (Anonymous) + anon→Google account linking.

import {
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signInAnonymously, signOut as fbSignOut, linkWithPopup, linkWithRedirect,
  onAuthStateChanged, type User,
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
    // If a Firebase user has an email address they are NOT anonymous —
    // this is the ground truth even if the isAnonymous flag hasn't
    // updated after an anon → Google account link.
    isAnonymous: u.isAnonymous && !u.email,
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
  return onAuthStateChanged(auth, (u) => {
    // Whenever a real Firebase user appears with an email or displayName,
    // clear any leftover local-guest flag — otherwise stale localStorage
    // from a previous guest session can cause "Guest mode" to render even
    // after a successful Google sign-in.
    if (u && !u.isAnonymous && (u.email || u.displayName)) {
      localStorage.removeItem(LOCAL_GUEST_MODE_KEY)
      localStorage.removeItem(LOCAL_UID_KEY)
    }
    cb(u ? toAuthUser(u) : null)
  })
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

// Some browsers (iOS Safari, in-app WebViews, PWA standalone mode) block
// third-party popups. Redirect is more reliable on those; popup is nicer on
// desktop. Detect once and pick the right flow.
function popupBlockedLikely(): boolean {
  try {
    const ua = navigator.userAgent
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
      || (navigator as unknown as { standalone?: boolean }).standalone === true
    const isIosSafari = /iP(ad|hone|od)/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    const isInAppBrowser = /(FBAN|FBAV|Instagram|Line|Twitter|WhatsApp)/i.test(ua)
    return isStandalone || isIosSafari || isInAppBrowser
  } catch { return false }
}

// Codes that mean "popup won't work here" — retry with redirect.
function isPopupFailure(code?: string): boolean {
  return code === 'auth/popup-blocked'
    || code === 'auth/popup-closed-by-user'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/operation-not-supported-in-this-environment'
}

// Google sign-in. If the user is currently anonymous, tries to link the Google
// credential to preserve their guest data. Falls back to a fresh Google sign-in
// (accepting data loss) if the Google account is already in use elsewhere.
// Falls back to redirect flow when the browser can't open popups.
export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!firebaseConfigured || !auth) {
    throw new Error('Firebase not configured — Google sign-in unavailable in local-only mode.')
  }
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const useRedirect = popupBlockedLikely()

  const current = auth.currentUser
  if (current?.isAnonymous) {
    try {
      if (useRedirect) {
        await linkWithRedirect(current, provider)
        return null  // browser navigates away; caller gets the user via completeRedirectSignIn on return
      }
      const cred = await linkWithPopup(current, provider)
      return toAuthUser(cred.user)
    } catch (err) {
      const code = (err as { code?: string }).code
      // Popup path failed — retry with redirect.
      if (isPopupFailure(code)) {
        await linkWithRedirect(current, provider)
        return null
      }
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        // Google account is already registered elsewhere — sign in with it directly.
        return await signInDirect(provider, useRedirect)
      }
      throw err
    }
  }
  return await signInDirect(provider, useRedirect)
}

async function signInDirect(provider: GoogleAuthProvider, useRedirect: boolean): Promise<AuthUser | null> {
  if (!auth) throw new Error('Firebase auth not initialised')
  try {
    if (useRedirect) {
      await signInWithRedirect(auth, provider)
      return null
    }
    const cred = await signInWithPopup(auth, provider)
    return toAuthUser(cred.user)
  } catch (err) {
    const code = (err as { code?: string }).code
    if (isPopupFailure(code)) {
      await signInWithRedirect(auth, provider)
      return null
    }
    throw err
  }
}

// Call once on app boot — if we're returning from a redirect flow, this
// completes the sign-in. Silent no-op otherwise.
export async function completeRedirectSignIn(): Promise<AuthUser | null> {
  if (!firebaseConfigured || !auth) return null
  try {
    const cred = await getRedirectResult(auth)
    if (cred?.user && !cred.user.isAnonymous && (cred.user.email || cred.user.displayName)) {
      // Successful Google redirect sign-in — clear any leftover guest flag.
      localStorage.removeItem(LOCAL_GUEST_MODE_KEY)
      localStorage.removeItem(LOCAL_UID_KEY)
    }
    return cred?.user ? toAuthUser(cred.user) : null
  } catch (e) {
    console.warn('completeRedirectSignIn failed', e)
    return null
  }
}

export async function signOutUser(): Promise<void> {
  localStorage.removeItem(LOCAL_GUEST_MODE_KEY)
  localStorage.removeItem(LOCAL_UID_KEY)
  if (firebaseConfigured && auth) {
    await fbSignOut(auth)
  }
}
