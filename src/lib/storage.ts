// Local persistence layer.
// Runs against localStorage when Firebase env isn't configured (dev / demo),
// and against Firestore + Storage when it is. Reads return null/[] if the user
// isn't signed in yet — sign-in is triggered explicitly by src/lib/auth.ts.

import { firebaseConfigured, db } from './firebase'
import {
  doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { currentUser, isLocalGuestUid, signInAsGuest } from './auth'
import type { Checkin, Consent, Measurement, Plan, UserProfile, WeeklyReview } from './types'

// True only when Firebase is configured AND the current UID is a real Firebase
// user (i.e. not a local guest). Prevents Firestore permission-denied errors
// when a guest falls back to local mode.
function useFirestore(): boolean {
  if (!firebaseConfigured || !db) return false
  const uid = currentUser()?.uid
  return !!uid && !isLocalGuestUid(uid)
}

function rid() {
  return 'id_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// The UID a caller should use for reads/writes. Null if nobody is signed in yet.
export function currentUid(): string | null {
  return currentUser()?.uid ?? null
}

// Older name kept for callers that MUST have a UID and are OK falling back to a
// guest session (e.g. saveProfile from the onboarding "Build my plan" tap).
export async function ensureSignedIn(): Promise<string> {
  const u = currentUser()
  if (u) return u.uid
  const guest = await signInAsGuest()
  return guest.uid
}

// -------- Profile --------
export async function saveProfile(p: Omit<UserProfile, 'id' | 'created_at'>) {
  const uid = await ensureSignedIn()
  const profile: UserProfile = { ...p, id: uid, created_at: new Date().toISOString() }
  if (useFirestore()) {
    await setDoc(doc(db!, 'users', uid), profile)
  } else {
    localStorage.setItem(`gymbuddy.profile.${uid}`, JSON.stringify(profile))
  }
  return profile
}

export async function loadProfile(): Promise<UserProfile | null> {
  const uid = currentUid()
  if (!uid) return null
  let profile: UserProfile | null = null
  if (useFirestore()) {
    const snap = await getDoc(doc(db!, 'users', uid))
    profile = snap.exists() ? (snap.data() as UserProfile) : null
  } else {
    const raw = localStorage.getItem(`gymbuddy.profile.${uid}`)
    profile = raw ? JSON.parse(raw) : null
  }
  if (!profile) return null
  // Migrate legacy 20-min session length → new 25-min floor.
  if ((profile.session_length as number) < 25) {
    profile = { ...profile, session_length: 25 }
  }
  // Legacy profiles predate the yoga opt-in — default to false.
  if (typeof profile.includes_yoga !== 'boolean') {
    profile = { ...profile, includes_yoga: false }
  }
  // Migrate the old includes_yoga boolean → new training_styles multi-select.
  if (!Array.isArray(profile.training_styles) || profile.training_styles.length === 0) {
    const styles: import('./types').TrainingStyle[] = ['strength_cardio']
    if (profile.includes_yoga) styles.push('yoga')
    profile = { ...profile, training_styles: styles }
  }
  return profile
}

export async function updateProfile(patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await loadProfile()
  if (!current) throw new Error('no profile')
  const merged = { ...current, ...patch }
  await saveProfile(merged)
  return merged
}

// -------- Equipment photos --------
export async function uploadEquipmentPhoto(file: File): Promise<string> {
  const uid = await ensureSignedIn()
  if (useFirestore()) {
    const storage = getStorage()
    const path = `equipment_photos/${uid}/${Date.now()}-${file.name}`
    const r = ref(storage, path)
    await uploadBytes(r, file)
    return await getDownloadURL(r)
  }
  return await fileToDataUrl(file)
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// -------- Plans --------
export async function savePlan(p: Omit<Plan, 'id' | 'user_id' | 'created_at'>): Promise<Plan> {
  const uid = await ensureSignedIn()
  const plan: Plan = { ...p, id: rid(), user_id: uid, created_at: new Date().toISOString() }
  if (useFirestore()) {
    const ref = await addDoc(collection(db!, 'users', uid, 'plans'), plan)
    plan.id = ref.id
    await setDoc(ref, plan)
  } else {
    const all = listLocal<Plan>(`gymbuddy.plans.${uid}`)
    all.push(plan)
    localStorage.setItem(`gymbuddy.plans.${uid}`, JSON.stringify(all))
  }
  return plan
}

export async function listPlans(): Promise<Plan[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const q = query(collection(db!, 'users', uid, 'plans'), orderBy('week_number', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Plan)
  }
  return listLocal<Plan>(`gymbuddy.plans.${uid}`).sort((a, b) => a.week_number - b.week_number)
}

export async function latestPlan(): Promise<Plan | null> {
  const plans = await listPlans()
  return plans.length ? plans[plans.length - 1] : null
}

export async function updatePlanExerciseVideo(planId: string, exerciseName: string, video_id: string) {
  const uid = currentUid()
  if (!uid) return
  if (useFirestore()) {
    const snap = await getDoc(doc(db!, 'users', uid, 'plans', planId))
    if (!snap.exists()) return
    const plan = snap.data() as Plan
    mutateVideoId(plan, exerciseName, video_id)
    await setDoc(doc(db!, 'users', uid, 'plans', planId), plan)
  } else {
    const all = listLocal<Plan>(`gymbuddy.plans.${uid}`)
    const idx = all.findIndex((p) => p.id === planId)
    if (idx === -1) return
    mutateVideoId(all[idx], exerciseName, video_id)
    localStorage.setItem(`gymbuddy.plans.${uid}`, JSON.stringify(all))
  }
}

function mutateVideoId(plan: Plan, exerciseName: string, video_id: string) {
  for (const d of plan.plan_json.days) {
    for (const e of d.exercises) {
      if (e.name === exerciseName) e.video_id = video_id
    }
  }
}

// -------- Check-ins --------
export async function saveCheckin(c: Omit<Checkin, 'id' | 'user_id' | 'checked_in_at'>): Promise<Checkin> {
  const uid = await ensureSignedIn()
  const checkin: Checkin = { ...c, id: rid(), user_id: uid, checked_in_at: new Date().toISOString() }
  if (useFirestore()) {
    const ref = await addDoc(collection(db!, 'users', uid, 'checkins'), checkin)
    checkin.id = ref.id
    await setDoc(ref, checkin)
  } else {
    const all = listLocal<Checkin>(`gymbuddy.checkins.${uid}`)
    all.push(checkin)
    localStorage.setItem(`gymbuddy.checkins.${uid}`, JSON.stringify(all))
  }
  return checkin
}

export async function listCheckins(): Promise<Checkin[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const q = query(collection(db!, 'users', uid, 'checkins'), orderBy('checked_in_at', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Checkin)
  }
  return listLocal<Checkin>(`gymbuddy.checkins.${uid}`)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
}

export async function checkinsForWeek(week_number: number): Promise<Checkin[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const q = query(
      collection(db!, 'users', uid, 'checkins'),
      where('week_number', '==', week_number),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Checkin)
  }
  return listLocal<Checkin>(`gymbuddy.checkins.${uid}`).filter((c) => c.week_number === week_number)
}

// -------- Weekly reviews --------
export async function saveWeeklyReview(r: Omit<WeeklyReview, 'id' | 'user_id'>): Promise<WeeklyReview> {
  const uid = await ensureSignedIn()
  const review: WeeklyReview = { ...r, id: rid(), user_id: uid }
  if (useFirestore()) {
    await setDoc(doc(db!, 'users', uid, 'weekly_reviews', `week_${r.week_number}`), review)
  } else {
    const all = listLocal<WeeklyReview>(`gymbuddy.reviews.${uid}`)
    const idx = all.findIndex((x) => x.week_number === r.week_number)
    if (idx >= 0) all[idx] = review
    else all.push(review)
    localStorage.setItem(`gymbuddy.reviews.${uid}`, JSON.stringify(all))
  }
  return review
}

export async function listWeeklyReviews(): Promise<WeeklyReview[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const snap = await getDocs(collection(db!, 'users', uid, 'weekly_reviews'))
    return snap.docs.map((d) => d.data() as WeeklyReview)
  }
  return listLocal<WeeklyReview>(`gymbuddy.reviews.${uid}`)
}

// Firestore rejects documents that carry `undefined` values. Since a
// measurement can legitimately skip any field, filter them out before writing.
function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

// -------- Measurements (daily body tracker) --------
export async function saveMeasurement(m: Omit<Measurement, 'id' | 'user_id' | 'logged_at' | 'logged_date'>): Promise<Measurement> {
  const uid = await ensureSignedIn()
  const now = new Date()
  const measurement: Measurement = {
    ...m,
    id: rid(),
    user_id: uid,
    logged_at: now.toISOString(),
    logged_date: now.toISOString().slice(0, 10),
  }
  const payload = stripUndefined(measurement)
  if (useFirestore()) {
    const ref = await addDoc(collection(db!, 'users', uid, 'measurements'), payload)
    measurement.id = ref.id
    await setDoc(ref, { ...payload, id: ref.id })
  } else {
    const all = listLocal<Measurement>(`gymbuddy.measurements.${uid}`)
    all.push(measurement)
    localStorage.setItem(`gymbuddy.measurements.${uid}`, JSON.stringify(all))
  }
  // Keep the profile's weight_kg current so next week's plan uses the latest value.
  if (typeof measurement.weight_kg === 'number' && measurement.weight_kg > 0) {
    try {
      await updateProfile({ weight_kg: measurement.weight_kg })
    } catch { /* profile may not exist yet — swallow */ }
  }
  return measurement
}

export async function listMeasurements(): Promise<Measurement[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const q = query(
      collection(db!, 'users', uid, 'measurements'),
      orderBy('logged_at', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Measurement)
  }
  return listLocal<Measurement>(`gymbuddy.measurements.${uid}`)
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at))
}

export async function latestMeasurement(): Promise<Measurement | null> {
  const all = await listMeasurements()
  return all[0] ?? null
}

export async function deleteMeasurement(id: string): Promise<void> {
  const uid = currentUid()
  if (!uid) return
  if (useFirestore()) {
    await setDoc(doc(db!, 'users', uid, 'measurements', id), { deleted: true }, { merge: true })
  } else {
    const all = listLocal<Measurement>(`gymbuddy.measurements.${uid}`).filter((m) => m.id !== id)
    localStorage.setItem(`gymbuddy.measurements.${uid}`, JSON.stringify(all))
  }
}

// -------- Consents --------
export async function saveConsentRecord(
  c: Omit<Consent, 'id' | 'user_id'>,
): Promise<Consent> {
  const uid = await ensureSignedIn()
  const record: Consent = { ...c, id: rid(), user_id: uid }
  if (useFirestore()) {
    const ref = await addDoc(collection(db!, 'users', uid, 'consents'), record)
    record.id = ref.id
    await setDoc(ref, record)
  } else {
    const all = listLocal<Consent>(`gymbuddy.consents.${uid}`)
    all.push(record)
    localStorage.setItem(`gymbuddy.consents.${uid}`, JSON.stringify(all))
  }
  return record
}

export async function listConsentRecords(): Promise<Consent[]> {
  const uid = currentUid()
  if (!uid) return []
  if (useFirestore()) {
    const q = query(
      collection(db!, 'users', uid, 'consents'),
      orderBy('accepted_at', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Consent)
  }
  return listLocal<Consent>(`gymbuddy.consents.${uid}`)
    .sort((a, b) => b.accepted_at.localeCompare(a.accepted_at))
}

// -------- helpers --------
function listLocal<T>(key: string): T[] {
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T[]) : []
}

export async function wipeLocal() {
  const uid = currentUid()
  if (!uid) return
  for (const k of [
    `gymbuddy.profile.${uid}`,
    `gymbuddy.plans.${uid}`,
    `gymbuddy.checkins.${uid}`,
    `gymbuddy.reviews.${uid}`,
  ]) localStorage.removeItem(k)
}
