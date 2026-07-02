// Local persistence layer.
// Runs against localStorage when Firebase env isn't configured (dev / demo),
// and against Firestore + Storage when it is. Reads return null/[] if the user
// isn't signed in yet — sign-in is triggered explicitly by src/lib/auth.ts.

import { firebaseConfigured, db } from './firebase'
import {
  doc, setDoc, getDoc, collection, addDoc, getDocs, query, where, orderBy,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { currentUser, signInAsGuest } from './auth'
import type { Checkin, Plan, UserProfile, WeeklyReview } from './types'

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
  if (firebaseConfigured && db) {
    await setDoc(doc(db, 'users', uid), profile)
  } else {
    localStorage.setItem(`gymbuddy.profile.${uid}`, JSON.stringify(profile))
  }
  return profile
}

export async function loadProfile(): Promise<UserProfile | null> {
  const uid = currentUid()
  if (!uid) return null
  if (firebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? (snap.data() as UserProfile) : null
  }
  const raw = localStorage.getItem(`gymbuddy.profile.${uid}`)
  return raw ? JSON.parse(raw) : null
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
  if (firebaseConfigured) {
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
  if (firebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'users', uid, 'plans'), plan)
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
  if (firebaseConfigured && db) {
    const q = query(collection(db, 'users', uid, 'plans'), orderBy('week_number', 'asc'))
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
  if (firebaseConfigured && db) {
    const snap = await getDoc(doc(db, 'users', uid, 'plans', planId))
    if (!snap.exists()) return
    const plan = snap.data() as Plan
    mutateVideoId(plan, exerciseName, video_id)
    await setDoc(doc(db, 'users', uid, 'plans', planId), plan)
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
  if (firebaseConfigured && db) {
    const ref = await addDoc(collection(db, 'users', uid, 'checkins'), checkin)
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
  if (firebaseConfigured && db) {
    const q = query(collection(db, 'users', uid, 'checkins'), orderBy('checked_in_at', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data() as Checkin)
  }
  return listLocal<Checkin>(`gymbuddy.checkins.${uid}`)
    .sort((a, b) => b.checked_in_at.localeCompare(a.checked_in_at))
}

export async function checkinsForWeek(week_number: number): Promise<Checkin[]> {
  const uid = currentUid()
  if (!uid) return []
  if (firebaseConfigured && db) {
    const q = query(
      collection(db, 'users', uid, 'checkins'),
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
  if (firebaseConfigured && db) {
    await setDoc(doc(db, 'users', uid, 'weekly_reviews', `week_${r.week_number}`), review)
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
  if (firebaseConfigured && db) {
    const snap = await getDocs(collection(db, 'users', uid, 'weekly_reviews'))
    return snap.docs.map((d) => d.data() as WeeklyReview)
  }
  return listLocal<WeeklyReview>(`gymbuddy.reviews.${uid}`)
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
