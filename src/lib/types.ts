// Data model — mirrors the GymBuddy-for-Claude spec (Firestore + client share these types).

export type Goal = 'fat_loss' | 'muscle_gain' | 'general_fitness' | 'strength'
export type Experience = 'never' | 'under_1m' | '1_3m' | '3_12m' | 'over_1y'
export type DietPref = 'veg' | 'non_veg' | 'egg_veg'
export type SessionLength = 25 | 30 | 45

// Canonical equipment vocabulary — keep tight so plans + photo detection stay consistent.
export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'machines'           // generic machine fallback
  | 'lat_pulldown'
  | 'leg_press'
  | 'chest_press_machine'
  | 'cables'
  | 'kettlebell'
  | 'resistance_bands'
  | 'treadmill'
  | 'pull_up_bar'

export type Injury = 'none' | 'lower_back' | 'knee' | 'shoulder' | 'neck' | 'wrist'
export type MedicalCondition =
  | 'none' | 'heart_condition' | 'high_bp' | 'pregnancy' | 'diabetes' | 'asthma'

export type Felt = 'easy' | 'ok' | 'hard' | 'pain'
export type EquipmentSource = 'photo' | 'manual' | 'both'

export interface UserProfile {
  id: string
  name: string
  age: number
  city: string
  height_cm: number      // required — drives BMI + plan personalization
  weight_kg: number      // required — drives protein target (g/kg × goal multiplier)
  goal: Goal
  experience: Experience
  days_per_week: number
  session_length: SessionLength
  equipment: Equipment[]
  equipment_source: EquipmentSource
  equipment_photo_urls: string[]
  diet_pref: DietPref
  injuries: Injury[]
  medical_conditions: MedicalCondition[]
  other_constraints: string
  current_week: number
  created_at: string
}

export type ExercisePhase = 'warmup' | 'main' | 'cooldown'

export interface Exercise {
  name: string
  phase: ExercisePhase
  sets: number
  reps: string
  rpe: string
  why: string
  form_cue: string
  youtube_search_query: string
  video_id: string | null
  uses_equipment: Equipment[]
  safe_for_user: boolean
  rest_seconds?: number      // rest between sets — used by the timer modal
  hold_seconds?: number      // for stretches / planks — the "work" duration
}

export interface PlanDay {
  day_label: string
  focus: string
  est_minutes: number
  exercises: Exercise[]
}

export interface Meal {
  name: string                 // Breakfast | Lunch | Dinner
  idea: string                 // e.g. "Besan chilla + curd"
  approx_protein_g: number
  ingredients: string[]        // e.g. ["1 cup besan (chickpea flour)", "1 chopped onion", ...]
  recipe: string[]             // ordered steps; keep short and beginner-friendly
  approx_kcal?: number
  prep_minutes?: number
}

export interface PlanJSON {
  week_number: number
  summary: string
  days: PlanDay[]
  diet: {
    daily_protein_target_g: number
    meals: Meal[]
  }
  safety_note: string
}

export interface Plan {
  id: string
  user_id: string
  week_number: number
  created_at: string
  source: 'initial' | 'adaptive'
  equipment_snapshot: Equipment[]
  plan_json: PlanJSON
}

export interface Checkin {
  id: string
  user_id: string
  plan_id: string
  week_number: number
  day_label: string
  checked_in_at: string
  exercises_done: string[]
  exercises_skipped: string[]
  felt?: Felt
  note?: string
}

// Daily / ad-hoc body measurement snapshot. Every field is optional per entry —
// you weigh yourself daily but measure with a tape once a week; both go here.
export interface Measurement {
  id: string
  user_id: string
  logged_at: string        // ISO timestamp
  logged_date: string      // YYYY-MM-DD — used to dedupe same-day entries
  weight_kg?: number
  waist_cm?: number
  chest_cm?: number
  arms_cm?: number         // relaxed upper-arm circumference
  thighs_cm?: number
  hips_cm?: number
  body_fat_pct?: number
  notes?: string
}

export type MeasurementField =
  | 'weight_kg' | 'waist_cm' | 'chest_cm' | 'arms_cm' | 'thighs_cm' | 'hips_cm' | 'body_fat_pct'

export interface WeeklyReview {
  id: string
  user_id: string
  week_number: number
  days_planned: number
  days_completed: number
  completion_pct: number
  summary_text: string
}

export interface FeltSummary {
  easy: number
  ok: number
  hard: number
  pain: number
}

// Legal / safety consents recorded per user. Every accept produces a new
// record so we retain full history even if the version text changes later.
export type ConsentKind = 'general_ai' | 'chronic_condition'

export interface Consent {
  id: string
  user_id: string
  kind: ConsentKind
  version: string              // matches CONSENT_VERSIONS in lib/consent.ts
  accepted: boolean            // always true when saved (record of consent, not refusal)
  accepted_at: string          // ISO timestamp
  medical_conditions_at_accept: string[]   // snapshot of user's medical_conditions at the moment of consent
  injuries_at_accept: string[]             // snapshot of injuries at the moment of consent
  text_hash: string            // short hash of the exact text shown — audit trail
}

export interface LastWeekSummary {
  completion_pct: number
  days_completed: number
  exercises_skipped: string[]
  felt_summary: FeltSummary
  equipment_changed: boolean
}
