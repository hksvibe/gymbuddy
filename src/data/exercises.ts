// Curated beginner-safe exercise library used by the mock planner (offline / no-API-key path).
// The real LLM-generated plans replace this once the Cloud Function is wired.

import type { Equipment, Exercise, Injury, MedicalCondition } from '../lib/types'

type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'overhead' | 'core' | 'cardio' | 'lunge'

interface ExerciseEntry extends Omit<Exercise, 'video_id' | 'uses_equipment' | 'safe_for_user'> {
  pattern: Pattern
  uses_equipment: Equipment[]   // what equipment IDs the exercise needs (any one is enough)
  avoid_injury: Injury[]
  avoid_medical: MedicalCondition[]
  approx_minutes: number       // duration including rest, used by Express Workout
}

export const EXERCISES: ExerciseEntry[] = [
  // ---- squat pattern ----
  {
    name: 'Bodyweight Squat', pattern: 'squat',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7',
    why: 'Builds leg strength with zero equipment — perfect to learn the squat groove.',
    form_cue: 'Chest up, push knees out, sit back like onto a chair.',
    youtube_search_query: 'bodyweight squat form beginner',
  },
  {
    name: 'Dumbbell Goblet Squat', pattern: 'squat',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Builds leg strength safely without loading your lower back.',
    form_cue: 'Hold one dumbbell at chest, sit back slowly, knees over toes.',
    youtube_search_query: 'dumbbell goblet squat form beginner',
  },
  {
    name: 'Leg Press Machine', pattern: 'squat',
    uses_equipment: ['leg_press', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Strong leg builder with back support — great for beginners.',
    form_cue: 'Feet shoulder-width, lower until knees ~90°, don\'t lock out.',
    youtube_search_query: 'leg press machine form beginner',
  },
  // ---- hinge pattern ----
  {
    name: 'Glute Bridge', pattern: 'hinge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6',
    why: 'Wakes up your glutes — protects your lower back over time.',
    form_cue: 'Squeeze glutes at the top, don\'t arch your lower back.',
    youtube_search_query: 'glute bridge form beginner',
  },
  {
    name: 'Dumbbell Romanian Deadlift', pattern: 'hinge',
    uses_equipment: ['dumbbells'], avoid_injury: ['lower_back'], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Trains hamstrings and glutes — the unsung heroes of a strong body.',
    form_cue: 'Soft knees, push hips back, keep dumbbells close to your shins.',
    youtube_search_query: 'dumbbell romanian deadlift form beginner',
  },
  {
    name: 'Dumbbell Hip Thrust', pattern: 'hinge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Glute focus without spinal load — back-friendly hinge.',
    form_cue: 'Shoulders on bench, drive hips up, ribs down.',
    youtube_search_query: 'dumbbell hip thrust beginner',
  },
  // ---- push pattern ----
  {
    name: 'Knee Push-up', pattern: 'push',
    uses_equipment: ['bodyweight'], avoid_injury: ['wrist'], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '8-12', rpe: '6-7',
    why: 'Builds chest, shoulders, and core — scale your first real push-up.',
    form_cue: 'Body in a straight line, lower chest to floor, push through palms.',
    youtube_search_query: 'knee pushup form beginner',
  },
  {
    name: 'Dumbbell Bench Press', pattern: 'push',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 8,
    sets: 3, reps: '8-10', rpe: '6-7',
    why: 'Builds chest and triceps — a classic upper-body builder.',
    form_cue: 'Elbows ~45°, lower slowly to chest, don\'t bounce.',
    youtube_search_query: 'dumbbell bench press form beginner',
  },
  {
    name: 'Chest Press Machine', pattern: 'push',
    uses_equipment: ['chest_press_machine', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Easy on the joints, locks you into safe form.',
    form_cue: 'Seat height: handles at mid-chest, push without locking elbows.',
    youtube_search_query: 'chest press machine form beginner',
  },
  // ---- pull pattern ----
  {
    name: 'Dumbbell One-Arm Row', pattern: 'pull',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Builds your back — the muscle most beginners forget.',
    form_cue: 'Flat back, pull elbow to hip, squeeze shoulder blade.',
    youtube_search_query: 'dumbbell one arm row form beginner',
  },
  {
    name: 'Lat Pulldown', pattern: 'pull',
    uses_equipment: ['lat_pulldown', 'cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'V-shape builder, easy to learn.',
    form_cue: 'Wide grip, pull bar to upper chest, lead with elbows.',
    youtube_search_query: 'lat pulldown form beginner',
  },
  {
    name: 'Seated Cable Row', pattern: 'pull',
    uses_equipment: ['cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7',
    why: 'Back thickness, posture, and grip — all in one.',
    form_cue: 'Tall chest, pull handle to belly, slow on the return.',
    youtube_search_query: 'seated cable row form beginner',
  },
  {
    name: 'Resistance Band Row', pattern: 'pull',
    uses_equipment: ['resistance_bands'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7',
    why: 'Travel-friendly back work that won\'t aggravate joints.',
    form_cue: 'Anchor the band, pull elbows back, squeeze shoulder blades.',
    youtube_search_query: 'resistance band row form beginner',
  },
  // ---- overhead pattern ----
  {
    name: 'Dumbbell Shoulder Press', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: ['shoulder'], avoid_medical: ['high_bp', 'heart_condition'], approx_minutes: 7,
    sets: 3, reps: '8-10', rpe: '6-7',
    why: 'Strong shoulders make every upper-body lift easier.',
    form_cue: 'Press straight up, don\'t flare elbows, brace your core.',
    youtube_search_query: 'dumbbell shoulder press form beginner',
  },
  {
    name: 'Dumbbell Lateral Raise', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6',
    why: 'Builds shoulder width safely with light weight.',
    form_cue: 'Slight bend in elbow, lift to shoulder height, slow down.',
    youtube_search_query: 'dumbbell lateral raise form beginner',
  },
  // ---- lunge pattern ----
  {
    name: 'Reverse Lunge', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: ['knee'], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7',
    why: 'Single-leg strength without the knee strain of a forward lunge.',
    form_cue: 'Step back, drop back knee gently, push through front heel.',
    youtube_search_query: 'reverse lunge form beginner',
  },
  {
    name: 'Dumbbell Step-up', pattern: 'lunge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7',
    why: 'Knee-friendly single-leg builder — control matters more than weight.',
    form_cue: 'Full foot on bench, push through heel, don\'t use back leg.',
    youtube_search_query: 'dumbbell step up form beginner',
  },
  // ---- core ----
  {
    name: 'Plank', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '20-30 sec', rpe: '6-7',
    why: 'Trains the whole midsection to stay tight under load.',
    form_cue: 'Straight line from head to heels, squeeze glutes, breathe.',
    youtube_search_query: 'plank form beginner',
  },
  {
    name: 'Dead Bug', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '8 each side', rpe: '6',
    why: 'Teaches your core to brace — back-saving exercise.',
    form_cue: 'Lower back flat to floor, move opposite arm + leg slowly.',
    youtube_search_query: 'dead bug exercise form beginner',
  },
  // ---- cardio ----
  {
    name: 'Treadmill Incline Walk', pattern: 'cardio',
    uses_equipment: ['treadmill'], avoid_injury: [], avoid_medical: ['heart_condition'], approx_minutes: 15,
    sets: 1, reps: '15 min @ 5-8% incline', rpe: '5-6',
    why: 'Burns calories without beating up your joints. Easy to recover from.',
    form_cue: 'Tall posture, no holding the rails, swing arms naturally.',
    youtube_search_query: 'treadmill incline walk fat loss',
  },
  {
    name: 'Brisk Walk (Outdoor)', pattern: 'cardio',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 20,
    sets: 1, reps: '20 min', rpe: '5-6',
    why: 'Free cardio. Adds up — every walk counts.',
    form_cue: 'Pace where you can talk but not sing.',
    youtube_search_query: 'brisk walking technique',
  },
]

export function pickExercises(
  patterns: Pattern[],
  equipment: Equipment[],
  injuries: Injury[],
  medical: MedicalCondition[],
  noJumping = false,
): Exercise[] {
  const out: Exercise[] = []
  const used = new Set<string>()
  for (const pat of patterns) {
    const candidates = EXERCISES.filter((e) => {
      if (e.pattern !== pat) return false
      if (used.has(e.name)) return false
      if (!e.uses_equipment.some((n) => equipment.includes(n))) return false
      if (e.avoid_injury.some((inj) => injuries.includes(inj))) return false
      if (e.avoid_medical.some((m) => medical.includes(m))) return false
      if (noJumping && /jump|jumping|burpee|box jump/i.test(e.name)) return false
      return true
    })
    if (candidates.length === 0) continue
    const pick = candidates[0]
    used.add(pick.name)
    const { pattern: _p, avoid_injury: _ai, avoid_medical: _am, approx_minutes: _ap, ...rest } = pick
    void _p; void _ai; void _am; void _ap
    out.push({
      ...rest,
      video_id: null,
      safe_for_user: true,
    })
  }
  return out
}

export function estimateMinutes(exercises: Exercise[]): number {
  return exercises.reduce((acc, ex) => {
    const entry = EXERCISES.find((e) => e.name === ex.name)
    return acc + (entry?.approx_minutes ?? 6)
  }, 0)
}

// Trim a day's exercises to fit within a target minute budget.
// Keep compounds (squat/hinge/push/pull) first; trim accessory work to fit.
export function trimToFit(exercises: Exercise[], targetMinutes: number): Exercise[] {
  const ordered = [...exercises]
  let total = estimateMinutes(ordered)
  while (total > targetMinutes && ordered.length > 2) {
    ordered.pop()
    total = estimateMinutes(ordered)
  }
  return ordered
}
