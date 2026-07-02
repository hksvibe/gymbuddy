// Data model — mirrors the GymBuddy-for-Claude spec (Firestore + client share these types).

export type Goal = 'fat_loss' | 'muscle_gain' | 'general_fitness' | 'strength'
export type Experience = 'never' | 'under_1m' | '1_3m' | '3_12m' | 'over_1y'
export type DietPref = 'veg' | 'non_veg' | 'egg_veg'
export type SessionLength = 20 | 30 | 45

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

export interface Exercise {
  name: string
  sets: number
  reps: string
  rpe: string
  why: string
  form_cue: string
  youtube_search_query: string
  video_id: string | null
  uses_equipment: Equipment[]
  safe_for_user: boolean
}

export interface PlanDay {
  day_label: string
  focus: string
  est_minutes: number
  exercises: Exercise[]
}

export interface Meal {
  name: string
  idea: string
  approx_protein_g: number
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

export interface LastWeekSummary {
  completion_pct: number
  days_completed: number
  exercises_skipped: string[]
  felt_summary: FeltSummary
  equipment_changed: boolean
}
