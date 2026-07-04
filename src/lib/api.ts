// generatePlan(): server call when Firebase Functions are wired, mock generator otherwise.
// Same return type so the UI doesn't care which path ran.

import { httpsCallable } from 'firebase/functions'
import { firebaseConfigured, fns } from './firebase'
import {
  estimateMinutes, padToMinimum, pickCooldown, pickExercises, pickWarmup, trimToFit,
} from '../data/exercises'
import { mealsFor, proteinTargetFor } from '../data/meals'
import { canonicalize } from '../data/equipment'
import type {
  Equipment, Goal, Experience, DietPref, Injury, MedicalCondition, SessionLength,
  LastWeekSummary, PlanJSON, UserProfile, Exercise,
} from './types'

export interface GeneratePlanInput {
  age: number
  height_cm: number
  weight_kg: number
  goal: Goal
  experience: Experience
  days_per_week: number
  session_length: SessionLength
  equipment: Equipment[]
  diet_pref: DietPref
  injuries: Injury[]
  medical_conditions: MedicalCondition[]
  other_constraints: string
  week_number: number
  last_week?: LastWeekSummary
}

export function profileToInput(
  p: UserProfile, week_number: number, last_week?: LastWeekSummary,
): GeneratePlanInput {
  return {
    age: p.age,
    height_cm: p.height_cm,
    weight_kg: p.weight_kg,
    goal: p.goal,
    experience: p.experience,
    days_per_week: p.days_per_week,
    session_length: p.session_length,
    equipment: p.equipment,
    diet_pref: p.diet_pref,
    injuries: p.injuries,
    medical_conditions: p.medical_conditions,
    other_constraints: p.other_constraints,
    week_number,
    last_week,
  }
}

export async function generatePlan(input: GeneratePlanInput): Promise<PlanJSON> {
  let raw: PlanJSON | null = null
  if (firebaseConfigured && fns) {
    try {
      const call = httpsCallable<GeneratePlanInput, PlanJSON>(fns, 'generatePlan')
      const res = await call(input)
      raw = res.data
    } catch (e) {
      // Firebase configured but function not deployed / secret missing / API down —
      // fall back to the offline planner so the app stays usable.
      console.warn('generatePlan callable failed, falling back to mock', e)
    }
  }
  if (!raw) raw = mockGeneratePlan(input)
  // Client-side guard: even if the model hallucinates equipment, scrub
  // exercises that reference gear the user doesn't have.
  return filterUnavailableEquipment(raw, input.equipment)
}

export async function detectEquipment(imageUrls: string[]): Promise<Equipment[]> {
  if (firebaseConfigured && fns && imageUrls.length > 0) {
    try {
      const call = httpsCallable<{ imageUrls: string[] }, { equipment: string[] }>(fns, 'detectEquipment')
      const res = await call({ imageUrls })
      return canonicalize(res.data.equipment)
    } catch (e) {
      console.warn('detectEquipment failed, falling back to defaults', e)
    }
  }
  // Offline / no-key fallback: a "gym starter pack" the user can edit.
  return ['dumbbells', 'bench', 'cables', 'treadmill']
}

export async function resolveVideo(query: string): Promise<string | null> {
  if (firebaseConfigured && fns) {
    try {
      const call = httpsCallable<{ query: string }, { video_id: string | null }>(fns, 'resolveVideo')
      const res = await call({ query })
      return res.data.video_id
    } catch (e) {
      console.warn('resolveVideo failed', e)
    }
  }
  return null
}

// ---------------------- Client-side scrub ----------------------
function filterUnavailableEquipment(plan: PlanJSON, available: Equipment[]): PlanJSON {
  // Bodyweight is always implicitly available — every user has a body.
  const set = new Set<Equipment>([...available, 'bodyweight'])
  const days = plan.days.map((d) => {
    const exercises = d.exercises.filter((ex) => {
      // Warm-up and cool-down are bodyweight-only and always survive.
      if (ex.phase === 'warmup' || ex.phase === 'cooldown') return true
      if (!ex.uses_equipment || ex.uses_equipment.length === 0) return true
      return ex.uses_equipment.some((eq) => set.has(eq))
    })
    return { ...d, exercises }
  })
  return { ...plan, days }
}

// ---------------------- Mock planner ----------------------
type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'overhead' | 'core' | 'cardio' | 'lunge'

const FULL_BODY_TEMPLATES: Pattern[][] = [
  ['squat', 'push', 'pull', 'core'],
  ['hinge', 'overhead', 'pull', 'core'],
  ['lunge', 'push', 'pull', 'cardio'],
  ['squat', 'pull', 'core', 'cardio'],
]

const PPL_TEMPLATES: Pattern[][] = [
  ['push', 'overhead', 'core'],
  ['pull', 'pull', 'core'],
  ['squat', 'hinge', 'lunge', 'core'],
]

const FOCUS_LABELS: Record<Pattern, string> = {
  squat: 'legs + core', hinge: 'posterior chain', push: 'chest + shoulders',
  pull: 'back + biceps', overhead: 'shoulders', core: 'core', cardio: 'cardio',
  lunge: 'single-leg + core',
}

// Minimum main-phase exercises every session must contain.
const MIN_MAIN_EXERCISES = 4
// Minimum session length in minutes (enforced elsewhere too).
const MIN_SESSION_MINUTES = 25

export function mockGeneratePlan(input: GeneratePlanInput): PlanJSON {
  const useSplit = input.days_per_week >= 5 ? 'ppl' : 'full'
  const tpls = useSplit === 'ppl' ? PPL_TEMPLATES : FULL_BODY_TEMPLATES
  const days = []
  const dayCount = Math.max(2, Math.min(6, input.days_per_week))
  const noJumping = /no\s*jump|no\s*jumping/i.test(input.other_constraints)
  const sessionLen = Math.max(MIN_SESSION_MINUTES, input.session_length)

  const lastPct = input.last_week?.completion_pct ?? 1
  const felt = input.last_week?.felt_summary
  let setBias = 0
  if (lastPct >= 0.85 && (!felt || felt.hard < felt.ok)) setBias = 1
  else if (lastPct < 0.6 || (felt && felt.hard > felt.ok + felt.easy)) setBias = -1

  for (let i = 0; i < dayCount; i++) {
    const tpl = tpls[i % tpls.length]
    let mainExercises = pickExercises(tpl, input.equipment, input.injuries, input.medical_conditions, noJumping)

    if (mainExercises.length === 0) {
      mainExercises = pickExercises(tpl, ['bodyweight'], input.injuries, input.medical_conditions, noJumping)
    }

    // Enforce the 4-exercise floor for the main phase, drawing from unused patterns.
    const fillerPatterns: Pattern[] = ['core', 'lunge', 'pull', 'squat', 'hinge', 'push']
    mainExercises = padToMinimum(
      mainExercises, fillerPatterns, input.equipment, input.injuries,
      input.medical_conditions, MIN_MAIN_EXERCISES, noJumping,
    )

    if (input.last_week?.exercises_skipped?.length) {
      const skipped = new Set(input.last_week.exercises_skipped.map((s) => s.toLowerCase()))
      mainExercises = mainExercises.map((e) => {
        if (!skipped.has(e.name.toLowerCase())) return e
        const alt = pickExercises([tpl[0]], ['bodyweight'], input.injuries, input.medical_conditions, noJumping)[0]
        return alt ?? e
      })
    }
    if (setBias !== 0) {
      mainExercises = mainExercises.map((e) => ({
        ...e,
        sets: Math.max(2, Math.min(5, e.sets + setBias)),
      }))
    }

    // Tag each exercise with the equipment it actually uses (intersection with the user's list).
    mainExercises = mainExercises.map((e) => ({
      ...e,
      uses_equipment: e.uses_equipment.filter((eq) => input.equipment.includes(eq)),
    })) as Exercise[]

    // Warm-up (dynamic) + cool-down (static stretch) — always included.
    const warmup = pickWarmup(input.medical_conditions)
    const cooldown = pickCooldown(input.medical_conditions)

    // Trim main phase to fit within budget, but never below the 4-exercise floor.
    const warmupMinutes = estimateMinutes(warmup)
    const cooldownMinutes = estimateMinutes(cooldown)
    const mainBudget = Math.max(15, sessionLen - warmupMinutes - cooldownMinutes)
    mainExercises = trimToFit(mainExercises, mainBudget, MIN_MAIN_EXERCISES)

    const dayExercises = [...warmup, ...mainExercises, ...cooldown]

    const focus = tpl.slice(0, 2).map((t) => FOCUS_LABELS[t]).join(' + ')
    const label = useSplit === 'ppl'
      ? `Day ${i + 1} - ${['Push', 'Pull', 'Legs'][i % 3]}`
      : `Day ${i + 1} - Full Body ${String.fromCharCode(65 + (i % 3))}`

    days.push({
      day_label: label,
      focus,
      est_minutes: Math.max(sessionLen, estimateMinutes(dayExercises)),
      exercises: dayExercises,
    })
  }

  const meals = mealsFor(input.diet_pref)
  const protein = proteinTargetFor(input.goal, input.weight_kg)

  const parts: string[] = []
  if (input.injuries.includes('lower_back')) parts.push("we've kept heavy spinal loading out")
  if (input.injuries.includes('knee')) parts.push('chosen knee-friendly options')
  if (input.injuries.includes('shoulder')) parts.push('avoided heavy overhead pressing')
  if (input.medical_conditions.includes('high_bp') || input.medical_conditions.includes('heart_condition')) {
    parts.push('kept intensity low — no breath-holding — please consult a doctor before starting')
  }
  if (input.medical_conditions.includes('pregnancy')) {
    parts.push('avoided supine work and high-impact — please follow professional guidance')
  }
  const safety_note = parts.length
    ? `Beginner intensity only. ${parts.join(', ')}. Stop if you feel sharp pain.`
    : 'Beginner intensity only. Stop if you feel sharp pain.'

  let summary = `Week ${input.week_number}: keep it simple and consistent. RPE 6-7 means "I could do 3-4 more reps."`
  if (input.week_number === 1) {
    summary = "Welcome — Week 1 is about showing up. Form first, weight later."
  } else if (input.last_week) {
    const eqChanged = input.last_week.equipment_changed
    if (input.last_week.felt_summary.pain > 0) {
      summary = "You flagged pain last week — we've swapped that pattern out. Talk to a doctor if it persists."
    } else if (input.last_week.completion_pct >= 0.85) {
      summary = `Crushed last week (${Math.round(input.last_week.completion_pct * 100)}% done) — small bump in volume this week.`
    } else if (input.last_week.completion_pct < 0.6) {
      summary = "Last week was rough — no guilt. We've simplified this week to help you build momentum."
    } else {
      summary = "Solid effort last week. We swapped what you skipped — same difficulty."
    }
    if (eqChanged) summary += ' Plan rebuilt around your updated equipment list.'
  }

  return {
    week_number: input.week_number,
    summary,
    days,
    diet: { daily_protein_target_g: protein, meals },
    safety_note,
  }
}
