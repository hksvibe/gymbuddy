// Curated beginner-safe exercise library used by the mock planner (offline / no-API-key path).
// The real LLM-generated plans replace this once the Cloud Function is wired.

import type { Equipment, Exercise, ExercisePhase, Injury, MedicalCondition } from '../lib/types'

type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'overhead' | 'core' | 'cardio' | 'lunge'

interface ExerciseEntry extends Omit<Exercise, 'video_id' | 'uses_equipment' | 'safe_for_user'> {
  pattern: Pattern
  uses_equipment: Equipment[]
  avoid_injury: Injury[]
  avoid_medical: MedicalCondition[]
  approx_minutes: number
}

// ------------------- Main-phase library -------------------
export const EXERCISES: ExerciseEntry[] = [
  // ---- squat pattern ----
  {
    name: 'Bodyweight Squat', phase: 'main', pattern: 'squat',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7', rest_seconds: 45,
    why: 'Builds leg strength with zero equipment — perfect to learn the squat groove.',
    form_cue: 'Chest up, push knees out, sit back like onto a chair.',
    youtube_search_query: 'bodyweight squat form beginner',
  },
  {
    name: 'Dumbbell Goblet Squat', phase: 'main', pattern: 'squat',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Builds leg strength safely without loading your lower back.',
    form_cue: 'Hold one dumbbell at chest, sit back slowly, knees over toes.',
    youtube_search_query: 'dumbbell goblet squat form beginner',
  },
  {
    name: 'Leg Press Machine', phase: 'main', pattern: 'squat',
    uses_equipment: ['leg_press', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Strong leg builder with back support — great for beginners.',
    form_cue: 'Feet shoulder-width, lower until knees ~90°, don\'t lock out.',
    youtube_search_query: 'leg press machine form beginner',
  },
  // ---- hinge pattern ----
  {
    name: 'Glute Bridge', phase: 'main', pattern: 'hinge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6', rest_seconds: 45,
    why: 'Wakes up your glutes — protects your lower back over time.',
    form_cue: 'Squeeze glutes at the top, don\'t arch your lower back.',
    youtube_search_query: 'glute bridge form beginner',
  },
  {
    name: 'Dumbbell Romanian Deadlift', phase: 'main', pattern: 'hinge',
    uses_equipment: ['dumbbells'], avoid_injury: ['lower_back'], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Trains hamstrings and glutes — the unsung heroes of a strong body.',
    form_cue: 'Soft knees, push hips back, keep dumbbells close to your shins.',
    youtube_search_query: 'dumbbell romanian deadlift form beginner',
  },
  {
    name: 'Dumbbell Hip Thrust', phase: 'main', pattern: 'hinge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Glute focus without spinal load — back-friendly hinge.',
    form_cue: 'Shoulders on bench, drive hips up, ribs down.',
    youtube_search_query: 'dumbbell hip thrust beginner',
  },
  // ---- push pattern ----
  {
    name: 'Knee Push-up', phase: 'main', pattern: 'push',
    uses_equipment: ['bodyweight'], avoid_injury: ['wrist'], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '8-12', rpe: '6-7', rest_seconds: 45,
    why: 'Builds chest, shoulders, and core — scale your first real push-up.',
    form_cue: 'Body in a straight line, lower chest to floor, push through palms.',
    youtube_search_query: 'knee pushup form beginner',
  },
  {
    name: 'Dumbbell Bench Press', phase: 'main', pattern: 'push',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 8,
    sets: 3, reps: '8-10', rpe: '6-7', rest_seconds: 60,
    why: 'Builds chest and triceps — a classic upper-body builder.',
    form_cue: 'Elbows ~45°, lower slowly to chest, don\'t bounce.',
    youtube_search_query: 'dumbbell bench press form beginner',
  },
  {
    name: 'Chest Press Machine', phase: 'main', pattern: 'push',
    uses_equipment: ['chest_press_machine', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Easy on the joints, locks you into safe form.',
    form_cue: 'Seat height: handles at mid-chest, push without locking elbows.',
    youtube_search_query: 'chest press machine form beginner',
  },
  // ---- pull pattern ----
  {
    name: 'Dumbbell One-Arm Row', phase: 'main', pattern: 'pull',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 45,
    why: 'Builds your back — the muscle most beginners forget.',
    form_cue: 'Flat back, pull elbow to hip, squeeze shoulder blade.',
    youtube_search_query: 'dumbbell one arm row form beginner',
  },
  {
    name: 'Lat Pulldown', phase: 'main', pattern: 'pull',
    uses_equipment: ['lat_pulldown', 'cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'V-shape builder, easy to learn.',
    form_cue: 'Wide grip, pull bar to upper chest, lead with elbows.',
    youtube_search_query: 'lat pulldown form beginner',
  },
  {
    name: 'Seated Cable Row', phase: 'main', pattern: 'pull',
    uses_equipment: ['cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Back thickness, posture, and grip — all in one.',
    form_cue: 'Tall chest, pull handle to belly, slow on the return.',
    youtube_search_query: 'seated cable row form beginner',
  },
  {
    name: 'Resistance Band Row', phase: 'main', pattern: 'pull',
    uses_equipment: ['resistance_bands'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7', rest_seconds: 45,
    why: 'Travel-friendly back work that won\'t aggravate joints.',
    form_cue: 'Anchor the band, pull elbows back, squeeze shoulder blades.',
    youtube_search_query: 'resistance band row form beginner',
  },
  // ---- overhead pattern ----
  {
    name: 'Dumbbell Shoulder Press', phase: 'main', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: ['shoulder'], avoid_medical: ['high_bp', 'heart_condition'], approx_minutes: 7,
    sets: 3, reps: '8-10', rpe: '6-7', rest_seconds: 60,
    why: 'Strong shoulders make every upper-body lift easier.',
    form_cue: 'Press straight up, don\'t flare elbows, brace your core.',
    youtube_search_query: 'dumbbell shoulder press form beginner',
  },
  {
    name: 'Dumbbell Lateral Raise', phase: 'main', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6', rest_seconds: 45,
    why: 'Builds shoulder width safely with light weight.',
    form_cue: 'Slight bend in elbow, lift to shoulder height, slow down.',
    youtube_search_query: 'dumbbell lateral raise form beginner',
  },
  // ---- lunge pattern ----
  {
    name: 'Reverse Lunge', phase: 'main', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: ['knee'], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7', rest_seconds: 45,
    why: 'Single-leg strength without the knee strain of a forward lunge.',
    form_cue: 'Step back, drop back knee gently, push through front heel.',
    youtube_search_query: 'reverse lunge form beginner',
  },
  {
    name: 'Dumbbell Step-up', phase: 'main', pattern: 'lunge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7', rest_seconds: 60,
    why: 'Knee-friendly single-leg builder — control matters more than weight.',
    form_cue: 'Full foot on bench, push through heel, don\'t use back leg.',
    youtube_search_query: 'dumbbell step up form beginner',
  },
  // ---- core ----
  {
    name: 'Plank', phase: 'main', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '20-30 sec', rpe: '6-7', rest_seconds: 30, hold_seconds: 30,
    why: 'Trains the whole midsection to stay tight under load.',
    form_cue: 'Straight line from head to heels, squeeze glutes, breathe.',
    youtube_search_query: 'plank form beginner',
  },
  {
    name: 'Dead Bug', phase: 'main', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '8 each side', rpe: '6', rest_seconds: 30,
    why: 'Teaches your core to brace — back-saving exercise.',
    form_cue: 'Lower back flat to floor, move opposite arm + leg slowly.',
    youtube_search_query: 'dead bug exercise form beginner',
  },
  // ---- cardio ----
  {
    name: 'Treadmill Incline Walk', phase: 'main', pattern: 'cardio',
    uses_equipment: ['treadmill'], avoid_injury: [], avoid_medical: ['heart_condition'], approx_minutes: 10,
    sets: 1, reps: '10 min @ 5-8% incline', rpe: '5-6', rest_seconds: 0,
    why: 'Burns calories without beating up your joints. Easy to recover from.',
    form_cue: 'Tall posture, no holding the rails, swing arms naturally.',
    youtube_search_query: 'treadmill incline walk fat loss',
  },
  {
    name: 'Brisk Walk (Outdoor)', phase: 'main', pattern: 'cardio',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 12,
    sets: 1, reps: '12 min', rpe: '5-6', rest_seconds: 0,
    why: 'Free cardio. Adds up — every walk counts.',
    form_cue: 'Pace where you can talk but not sing.',
    youtube_search_query: 'brisk walking technique',
  },
]

// ------------------- Warm-up (dynamic) -------------------
// Every session starts with these — under 5 minutes total.
const WARMUP_EXERCISES: ExerciseEntry[] = [
  {
    name: 'Marching in Place', phase: 'warmup', pattern: 'cardio',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '60 sec', rpe: '4-5', rest_seconds: 0, hold_seconds: 60,
    why: 'Wakes your heart rate up gradually before real work.',
    form_cue: 'Lift knees to hip height, swing arms opposite legs.',
    youtube_search_query: 'marching in place warm up',
  },
  {
    name: 'Arm Circles', phase: 'warmup', pattern: 'overhead',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '10 forward + 10 back', rpe: '4', rest_seconds: 0,
    why: 'Opens the shoulder joint before any pressing or pulling.',
    form_cue: 'Big circles, controlled speed, both directions.',
    youtube_search_query: 'arm circles warm up',
  },
  {
    name: 'Bodyweight Squat to Reach', phase: 'warmup', pattern: 'squat',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '10 reps', rpe: '4-5', rest_seconds: 0,
    why: 'Grooves the squat pattern and warms up the hips.',
    form_cue: 'Sit back, then stand and reach both arms overhead.',
    youtube_search_query: 'bodyweight squat to reach warm up',
  },
  {
    name: 'Hip Circles', phase: 'warmup', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '8 each side', rpe: '4', rest_seconds: 0,
    why: 'Loosens hips so squats and hinges feel smoother.',
    form_cue: 'Hands on hips, big controlled circles.',
    youtube_search_query: 'hip circles warm up',
  },
]

// ------------------- Cool-down (static stretch) -------------------
// Every session ends with these — under 5 minutes total.
const COOLDOWN_EXERCISES: ExerciseEntry[] = [
  {
    name: 'Standing Quad Stretch', phase: 'cooldown', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Stretches the front of your thighs after squats and lunges.',
    form_cue: 'Grab your ankle behind you, knees together, tall posture.',
    youtube_search_query: 'standing quad stretch',
  },
  {
    name: 'Standing Hamstring Stretch', phase: 'cooldown', pattern: 'hinge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Relaxes hamstrings after any leg work.',
    form_cue: 'One heel forward on floor, hinge from hips, back flat.',
    youtube_search_query: 'standing hamstring stretch',
  },
  {
    name: 'Cross-Body Shoulder Stretch', phase: 'cooldown', pattern: 'push',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Opens shoulders after pressing and rowing.',
    form_cue: 'Pull arm across chest with the opposite hand, feel a gentle stretch.',
    youtube_search_query: 'cross body shoulder stretch',
  },
  {
    name: 'Child\'s Pose', phase: 'cooldown', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: ['pregnancy'], approx_minutes: 1,
    sets: 1, reps: '60 sec', rpe: '2', rest_seconds: 0, hold_seconds: 60,
    why: 'Lengthens the back and calms breathing at the end.',
    form_cue: 'Kneel, sit hips back to heels, reach arms forward, breathe slowly.',
    youtube_search_query: 'childs pose stretch beginner',
  },
]

function toExercise(entry: ExerciseEntry): Exercise {
  const {
    pattern: _p, avoid_injury: _ai, avoid_medical: _am, approx_minutes: _ap, ...rest
  } = entry
  void _p; void _ai; void _am; void _ap
  return {
    ...rest,
    video_id: null,
    safe_for_user: true,
  }
}

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
    used.add(candidates[0].name)
    out.push(toExercise(candidates[0]))
  }
  return out
}

// Warm-up + cool-down: fixed sequences (filtered for medical safety).
// Total warm-up ~4 min, cool-down ~4 min.
export function pickWarmup(medical: MedicalCondition[]): Exercise[] {
  return WARMUP_EXERCISES
    .filter((e) => !e.avoid_medical.some((m) => medical.includes(m)))
    .map(toExercise)
}

export function pickCooldown(medical: MedicalCondition[]): Exercise[] {
  return COOLDOWN_EXERCISES
    .filter((e) => !e.avoid_medical.some((m) => medical.includes(m)))
    .map(toExercise)
}

export function estimateMinutes(exercises: Exercise[]): number {
  return exercises.reduce((acc, ex) => {
    const entry = [...EXERCISES, ...WARMUP_EXERCISES, ...COOLDOWN_EXERCISES]
      .find((e) => e.name === ex.name)
    return acc + (entry?.approx_minutes ?? 6)
  }, 0)
}

// Trim a list of exercises to fit within a target minute budget while keeping
// at least `minKept` exercises. Trailing accessories drop first.
export function trimToFit(exercises: Exercise[], targetMinutes: number, minKept = 2): Exercise[] {
  const ordered = [...exercises]
  let total = estimateMinutes(ordered)
  while (total > targetMinutes && ordered.length > minKept) {
    ordered.pop()
    total = estimateMinutes(ordered)
  }
  return ordered
}

// Backfill a main-exercise list up to `minCount` by pulling from remaining
// pattern matches (used to enforce "min 4 main exercises per day").
export function padToMinimum(
  current: Exercise[],
  fallbackPatterns: Pattern[],
  equipment: Equipment[],
  injuries: Injury[],
  medical: MedicalCondition[],
  minCount: number,
  noJumping = false,
): Exercise[] {
  const out = [...current]
  const used = new Set(out.map((e) => e.name))
  const bodyweightFallback = ['bodyweight'] as Equipment[]

  for (const pat of fallbackPatterns) {
    if (out.length >= minCount) break
    const candidates = [...EXERCISES]
      .filter((e) => e.pattern === pat)
      .filter((e) => !used.has(e.name))
      .filter((e) => !e.avoid_injury.some((i) => injuries.includes(i)))
      .filter((e) => !e.avoid_medical.some((m) => medical.includes(m)))
      .filter((e) => !noJumping || !/jump|jumping|burpee|box jump/i.test(e.name))

    // Prefer exercises that use the user's equipment, else fall back to bodyweight.
    let pick = candidates.find((e) => e.uses_equipment.some((eq) => equipment.includes(eq)))
    if (!pick) pick = candidates.find((e) => e.uses_equipment.some((eq) => bodyweightFallback.includes(eq)))
    if (pick) {
      out.push(toExercise(pick))
      used.add(pick.name)
    }
  }
  return out
}

export type { ExercisePhase }
