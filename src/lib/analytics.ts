// Thin wrapper around Firebase Analytics for the deck's leading indicators.
// Silent no-op in dev / when Firebase isn't configured — screens can call
// logEvent() unconditionally without null checks.

import { getAnalytics, isSupported, logEvent as fbLogEvent, type Analytics } from 'firebase/analytics'
import { firebaseConfigured, firebaseApp } from './firebase'

let analytics: Analytics | null = null
let bootPromise: Promise<void> | null = null

async function ensureAnalytics(): Promise<void> {
  if (analytics || !firebaseConfigured || !firebaseApp) return
  if (!bootPromise) {
    bootPromise = (async () => {
      try {
        const supported = await isSupported()
        if (supported) analytics = getAnalytics(firebaseApp!)
      } catch (e) {
        console.warn('analytics init failed', e)
      }
    })()
  }
  await bootPromise
}

// Fire-and-forget event log. Never throws.
export function logEvent(name: string, params?: Record<string, string | number | boolean>): void {
  ensureAnalytics()
    .then(() => {
      if (analytics) fbLogEvent(analytics, name, params)
    })
    .catch(() => { /* swallow */ })
}
