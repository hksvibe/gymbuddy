// Curated beginner-safe exercise library used by the mock planner (offline / no-API-key path).
// The real LLM-generated plans replace this once the Cloud Function is wired.

import type {
  Equipment, Exercise, ExerciseIntensity, ExercisePhase, Experience,
  Injury, MedicalCondition,
} from '../lib/types'

type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'overhead' | 'core' | 'cardio' | 'lunge' | 'yoga'

interface ExerciseEntry extends Omit<Exercise, 'video_id' | 'uses_equipment' | 'safe_for_user'> {
  pattern: Pattern
  uses_equipment: Equipment[]
  avoid_injury: Injury[]
  avoid_medical: MedicalCondition[]
  approx_minutes: number
}

// Which intensity tiers each experience level is allowed to see in the plan.
// Everyone gets 'light' — it's the base tier. As experience grows we unlock
// medium then heavy. Beginners can still see medium on strength-focused days
// via the 'foundational' hint in pickExercises, but the default weight is light.
export function allowedIntensities(exp: Experience): ExerciseIntensity[] {
  switch (exp) {
    case 'never':    return ['light']
    case 'under_1m': return ['light']
    case '1_3m':     return ['light', 'medium']
    case '3_12m':    return ['light', 'medium']
    case 'over_1y':  return ['medium', 'heavy']
    default:         return ['light']
  }
}

export type { Pattern }

// ------------------- Main-phase library -------------------
export const EXERCISES: ExerciseEntry[] = [
  // ==================== LIGHT (bodyweight + bands + isolation) ====================
  {
    name: 'Bodyweight Squat', phase: 'main', intensity: 'light', pattern: 'squat',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7', rest_seconds: 45,
    why: 'Builds leg strength with zero equipment — perfect to learn the squat groove.',
    form_cue: 'Chest up, push knees out, sit back like onto a chair.',
    youtube_search_query: 'bodyweight squat form beginner',
  },
  {
    name: 'Glute Bridge', phase: 'main', intensity: 'light', pattern: 'hinge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6', rest_seconds: 45,
    why: 'Wakes up your glutes — protects your lower back over time.',
    form_cue: 'Squeeze glutes at the top, don\'t arch your lower back.',
    youtube_search_query: 'glute bridge form beginner',
  },
  {
    name: 'Knee Push-up', phase: 'main', intensity: 'light', pattern: 'push',
    uses_equipment: ['bodyweight'], avoid_injury: ['wrist'], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '8-12', rpe: '6-7', rest_seconds: 45,
    why: 'Builds chest, shoulders, and core — scale your first real push-up.',
    form_cue: 'Body in a straight line, lower chest to floor, push through palms.',
    youtube_search_query: 'knee pushup form beginner',
  },
  {
    name: 'Reverse Lunge', phase: 'main', intensity: 'light', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: ['knee'], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7', rest_seconds: 45,
    why: 'Single-leg strength without the knee strain of a forward lunge.',
    form_cue: 'Step back, drop back knee gently, push through front heel.',
    youtube_search_query: 'reverse lunge form beginner',
  },
  {
    name: 'Plank', phase: 'main', intensity: 'light', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '20-30 sec', rpe: '6-7', rest_seconds: 30, hold_seconds: 30,
    why: 'Trains the whole midsection to stay tight under load.',
    form_cue: 'Straight line from head to heels, squeeze glutes, breathe.',
    youtube_search_query: 'plank form beginner',
  },
  {
    name: 'Dead Bug', phase: 'main', intensity: 'light', pattern: 'core',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 4,
    sets: 3, reps: '8 each side', rpe: '6', rest_seconds: 30,
    why: 'Teaches your core to brace — back-saving exercise.',
    form_cue: 'Lower back flat to floor, move opposite arm + leg slowly.',
    youtube_search_query: 'dead bug exercise form beginner',
  },
  {
    name: 'Brisk Walk (Outdoor)', phase: 'main', intensity: 'light', pattern: 'cardio',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 12,
    sets: 1, reps: '12 min', rpe: '5-6', rest_seconds: 0,
    why: 'Free cardio. Adds up — every walk counts.',
    form_cue: 'Pace where you can talk but not sing.',
    youtube_search_query: 'brisk walking technique',
  },
  {
    name: 'Treadmill Incline Walk', phase: 'main', intensity: 'light', pattern: 'cardio',
    uses_equipment: ['treadmill'], avoid_injury: [], avoid_medical: ['heart_condition'], approx_minutes: 10,
    sets: 1, reps: '10 min @ 5-8% incline', rpe: '5-6', rest_seconds: 0,
    why: 'Burns calories without beating up your joints. Easy to recover from.',
    form_cue: 'Tall posture, no holding the rails, swing arms naturally.',
    youtube_search_query: 'treadmill incline walk fat loss',
  },
  {
    name: 'Resistance Band Row', phase: 'main', intensity: 'light', pattern: 'pull',
    uses_equipment: ['resistance_bands'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 3, reps: '12-15', rpe: '6-7', rest_seconds: 45,
    why: 'Travel-friendly back work that won\'t aggravate joints.',
    form_cue: 'Anchor the band, pull elbows back, squeeze shoulder blades.',
    youtube_search_query: 'resistance band row form beginner',
  },
  {
    name: 'Dumbbell Lateral Raise', phase: 'main', intensity: 'light', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 5,
    sets: 3, reps: '12-15', rpe: '6', rest_seconds: 45,
    why: 'Builds shoulder width safely with light weight.',
    form_cue: 'Slight bend in elbow, lift to shoulder height, slow down.',
    youtube_search_query: 'dumbbell lateral raise form beginner',
  },

  // ==================== MEDIUM (dumbbell / cable / machine compounds) ====================
  {
    name: 'Dumbbell Goblet Squat', phase: 'main', intensity: 'medium', pattern: 'squat',
    uses_equipment: ['dumbbells'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Builds leg strength safely without loading your lower back.',
    form_cue: 'Hold one dumbbell at chest, sit back slowly, knees over toes.',
    youtube_search_query: 'dumbbell goblet squat form beginner',
  },
  {
    name: 'Leg Press Machine', phase: 'main', intensity: 'medium', pattern: 'squat',
    uses_equipment: ['leg_press', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Strong leg builder with back support — great for beginners.',
    form_cue: 'Feet shoulder-width, lower until knees ~90°, don\'t lock out.',
    youtube_search_query: 'leg press machine form beginner',
  },
  {
    name: 'Dumbbell Romanian Deadlift', phase: 'main', intensity: 'medium', pattern: 'hinge',
    uses_equipment: ['dumbbells'], avoid_injury: ['lower_back'], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Trains hamstrings and glutes — the unsung heroes of a strong body.',
    form_cue: 'Soft knees, push hips back, keep dumbbells close to your shins.',
    youtube_search_query: 'dumbbell romanian deadlift form beginner',
  },
  {
    name: 'Dumbbell Hip Thrust', phase: 'main', intensity: 'medium', pattern: 'hinge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Glute focus without spinal load — back-friendly hinge.',
    form_cue: 'Shoulders on bench, drive hips up, ribs down.',
    youtube_search_query: 'dumbbell hip thrust beginner',
  },
  {
    name: 'Dumbbell Bench Press', phase: 'main', intensity: 'medium', pattern: 'push',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 8,
    sets: 3, reps: '8-10', rpe: '6-7', rest_seconds: 60,
    why: 'Builds chest and triceps — a classic upper-body builder.',
    form_cue: 'Elbows ~45°, lower slowly to chest, don\'t bounce.',
    youtube_search_query: 'dumbbell bench press form beginner',
  },
  {
    name: 'Chest Press Machine', phase: 'main', intensity: 'medium', pattern: 'push',
    uses_equipment: ['chest_press_machine', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Easy on the joints, locks you into safe form.',
    form_cue: 'Seat height: handles at mid-chest, push without locking elbows.',
    youtube_search_query: 'chest press machine form beginner',
  },
  {
    name: 'Dumbbell One-Arm Row', phase: 'main', intensity: 'medium', pattern: 'pull',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 45,
    why: 'Builds your back — the muscle most beginners forget.',
    form_cue: 'Flat back, pull elbow to hip, squeeze shoulder blade.',
    youtube_search_query: 'dumbbell one arm row form beginner',
  },
  {
    name: 'Lat Pulldown', phase: 'main', intensity: 'medium', pattern: 'pull',
    uses_equipment: ['lat_pulldown', 'cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'V-shape builder, easy to learn.',
    form_cue: 'Wide grip, pull bar to upper chest, lead with elbows.',
    youtube_search_query: 'lat pulldown form beginner',
  },
  {
    name: 'Seated Cable Row', phase: 'main', intensity: 'medium', pattern: 'pull',
    uses_equipment: ['cables', 'machines'], avoid_injury: [], avoid_medical: [], approx_minutes: 7,
    sets: 3, reps: '10-12', rpe: '6-7', rest_seconds: 60,
    why: 'Back thickness, posture, and grip — all in one.',
    form_cue: 'Tall chest, pull handle to belly, slow on the return.',
    youtube_search_query: 'seated cable row form beginner',
  },
  {
    name: 'Dumbbell Shoulder Press', phase: 'main', intensity: 'medium', pattern: 'overhead',
    uses_equipment: ['dumbbells'], avoid_injury: ['shoulder'], avoid_medical: ['high_bp', 'heart_condition'], approx_minutes: 7,
    sets: 3, reps: '8-10', rpe: '6-7', rest_seconds: 60,
    why: 'Strong shoulders make every upper-body lift easier.',
    form_cue: 'Press straight up, don\'t flare elbows, brace your core.',
    youtube_search_query: 'dumbbell shoulder press form beginner',
  },
  {
    name: 'Dumbbell Step-up', phase: 'main', intensity: 'medium', pattern: 'lunge',
    uses_equipment: ['dumbbells', 'bench'], avoid_injury: [], avoid_medical: [], approx_minutes: 6,
    sets: 2, reps: '10 each leg', rpe: '6-7', rest_seconds: 60,
    why: 'Knee-friendly single-leg builder — control matters more than weight.',
    form_cue: 'Full foot on bench, push through heel, don\'t use back leg.',
    youtube_search_query: 'dumbbell step up form beginner',
  },

  // ==================== HEAVY (barbell compounds + weighted advanced) ====================
  {
    name: 'Barbell Back Squat', phase: 'main', intensity: 'heavy', pattern: 'squat',
    uses_equipment: ['barbell'], avoid_injury: ['lower_back', 'knee'],
    avoid_medical: ['high_bp', 'heart_condition', 'pregnancy'], approx_minutes: 10,
    sets: 4, reps: '6-8', rpe: '7', rest_seconds: 120,
    why: 'The king of lower-body compounds. Builds serious total-body strength.',
    form_cue: 'Bar on upper back, brace hard, break at hips + knees together.',
    youtube_search_query: 'barbell back squat form beginner',
  },
  {
    name: 'Barbell Romanian Deadlift', phase: 'main', intensity: 'heavy', pattern: 'hinge',
    uses_equipment: ['barbell'], avoid_injury: ['lower_back'],
    avoid_medical: ['high_bp', 'heart_condition', 'pregnancy'], approx_minutes: 10,
    sets: 4, reps: '6-8', rpe: '7', rest_seconds: 120,
    why: 'Serious posterior-chain work. Only when your hinge groove is solid.',
    form_cue: 'Neutral spine, push hips back, bar close to legs, no rounding.',
    youtube_search_query: 'barbell romanian deadlift form beginner',
  },
  {
    name: 'Barbell Bench Press', phase: 'main', intensity: 'heavy', pattern: 'push',
    uses_equipment: ['barbell', 'bench'], avoid_injury: ['shoulder', 'wrist'],
    avoid_medical: ['high_bp', 'heart_condition'], approx_minutes: 10,
    sets: 4, reps: '6-8', rpe: '7', rest_seconds: 120,
    why: 'The classic upper-body strength builder.',
    form_cue: 'Shoulder blades pinned, feet planted, bar to mid-chest, drive up.',
    youtube_search_query: 'barbell bench press form beginner',
  },
  {
    name: 'Barbell Row', phase: 'main', intensity: 'heavy', pattern: 'pull',
    uses_equipment: ['barbell'], avoid_injury: ['lower_back'],
    avoid_medical: ['high_bp', 'heart_condition', 'pregnancy'], approx_minutes: 9,
    sets: 4, reps: '6-8', rpe: '7', rest_seconds: 120,
    why: 'The heaviest way to grow a strong, thick back.',
    form_cue: 'Hinge to ~45°, flat back, pull bar to belly, control the eccentric.',
    youtube_search_query: 'barbell row form beginner',
  },
  {
    name: 'Barbell Overhead Press', phase: 'main', intensity: 'heavy', pattern: 'overhead',
    uses_equipment: ['barbell'], avoid_injury: ['shoulder', 'lower_back'],
    avoid_medical: ['high_bp', 'heart_condition', 'pregnancy'], approx_minutes: 9,
    sets: 4, reps: '6-8', rpe: '7', rest_seconds: 120,
    why: 'Standing shoulder press — full-body strength, not just shoulders.',
    form_cue: 'Squeeze glutes, brace core, press straight up, no leaning back.',
    youtube_search_query: 'barbell overhead press form beginner',
  },
  {
    name: 'Weighted Pull-up', phase: 'main', intensity: 'heavy', pattern: 'pull',
    uses_equipment: ['pull_up_bar', 'dumbbells'], avoid_injury: ['shoulder', 'wrist'],
    avoid_medical: [], approx_minutes: 8,
    sets: 4, reps: '5-8', rpe: '7', rest_seconds: 120,
    why: 'Bodyweight king with a twist. Advanced back and grip strength.',
    form_cue: 'Dead hang, drive elbows down, chin over bar, full range.',
    youtube_search_query: 'weighted pull up form beginner',
  },

  // ==================== YOGA (opt-in day) ====================
  {
    name: 'Sun Salutation (Surya Namaskar A)', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['lower_back'],
    avoid_medical: ['pregnancy'], approx_minutes: 6,
    sets: 3, reps: '3 rounds', rpe: '5-6', rest_seconds: 30,
    why: 'A full-body flow that warms every joint and moves in every direction.',
    form_cue: 'Move with breath — inhale up, exhale fold. Never rush.',
    youtube_search_query: 'surya namaskar a beginner yoga',
  },
  {
    name: 'Warrior II (Virabhadrasana II)', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['knee'], avoid_medical: [], approx_minutes: 4,
    sets: 2, reps: '45 sec each side', rpe: '5', rest_seconds: 20, hold_seconds: 45,
    why: 'Builds leg endurance, opens hips, teaches steady breath under tension.',
    form_cue: 'Front knee over ankle, arms parallel to floor, gaze past front hand.',
    youtube_search_query: 'warrior 2 pose beginner yoga',
  },
  {
    name: 'Downward-Facing Dog', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['wrist', 'shoulder'],
    avoid_medical: ['high_bp'], approx_minutes: 3,
    sets: 3, reps: '30 sec', rpe: '4-5', rest_seconds: 15, hold_seconds: 30,
    why: 'Lengthens the whole posterior chain and calms the nervous system.',
    form_cue: 'Push floor away, heels reach down, spine long, breathe.',
    youtube_search_query: 'downward dog pose beginner yoga',
  },
  {
    name: 'Bridge Pose (Setu Bandha)', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['neck'], avoid_medical: [], approx_minutes: 3,
    sets: 3, reps: '45 sec', rpe: '4-5', rest_seconds: 20, hold_seconds: 45,
    why: 'Wakes up glutes, opens the front of the hips, back-friendly.',
    form_cue: 'Feet hip-width, press through heels, lift hips, chin off chest.',
    youtube_search_query: 'bridge pose beginner yoga',
  },
  {
    name: 'Tree Pose (Vrikshasana)', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['knee'], avoid_medical: [], approx_minutes: 3,
    sets: 2, reps: '30 sec each side', rpe: '4', rest_seconds: 15, hold_seconds: 30,
    why: 'Builds balance, focus, and ankle strength — grounds the whole session.',
    form_cue: 'Foot on inner calf or thigh (not knee), hands at heart or overhead.',
    youtube_search_query: 'tree pose beginner yoga',
  },
  {
    name: 'Cat-Cow Flow', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 3,
    sets: 3, reps: '10 rounds', rpe: '3-4', rest_seconds: 10,
    why: 'Mobilises the spine — the best 3 minutes for anyone who sits at a desk.',
    form_cue: 'On hands and knees — inhale arch, exhale round. Slow and steady.',
    youtube_search_query: 'cat cow pose beginner yoga',
  },
  {
    name: 'Cobra Pose (Bhujangasana)', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: ['lower_back', 'wrist'],
    avoid_medical: ['pregnancy'], approx_minutes: 3,
    sets: 3, reps: '20 sec', rpe: '4', rest_seconds: 15, hold_seconds: 20,
    why: 'Gentle back extension after any seated work or forward folds.',
    form_cue: 'Elbows soft, shoulders down, lift chest only as far as feels good.',
    youtube_search_query: 'cobra pose beginner yoga',
  },
  {
    name: 'Seated Forward Fold', phase: 'main', intensity: 'light', pattern: 'yoga',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 3,
    sets: 2, reps: '45 sec', rpe: '3', rest_seconds: 15, hold_seconds: 45,
    why: 'Slowly lengthens the whole back of the body. Calms the mind.',
    form_cue: 'Legs long, hinge from hips (not spine), reach for shins/feet.',
    youtube_search_query: 'seated forward fold beginner yoga',
  },
]

// ------------------- Warm-up (dynamic) -------------------
const WARMUP_EXERCISES: ExerciseEntry[] = [
  {
    name: 'Marching in Place', phase: 'warmup', intensity: 'light', pattern: 'cardio',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '60 sec', rpe: '4-5', rest_seconds: 0, hold_seconds: 60,
    why: 'Wakes your heart rate up gradually before real work.',
    form_cue: 'Lift knees to hip height, swing arms opposite legs.',
    youtube_search_query: 'marching in place warm up',
  },
  {
    name: 'Arm Circles', phase: 'warmup', intensity: 'light', pattern: 'overhead',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '10 forward + 10 back', rpe: '4', rest_seconds: 0,
    why: 'Opens the shoulder joint before any pressing or pulling.',
    form_cue: 'Big circles, controlled speed, both directions.',
    youtube_search_query: 'arm circles warm up',
  },
  {
    name: 'Bodyweight Squat to Reach', phase: 'warmup', intensity: 'light', pattern: 'squat',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '10 reps', rpe: '4-5', rest_seconds: 0,
    why: 'Grooves the squat pattern and warms up the hips.',
    form_cue: 'Sit back, then stand and reach both arms overhead.',
    youtube_search_query: 'bodyweight squat to reach warm up',
  },
  {
    name: 'Hip Circles', phase: 'warmup', intensity: 'light', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '8 each side', rpe: '4', rest_seconds: 0,
    why: 'Loosens hips so squats and hinges feel smoother.',
    form_cue: 'Hands on hips, big controlled circles.',
    youtube_search_query: 'hip circles warm up',
  },
]

// ------------------- Cool-down (static stretch) -------------------
const COOLDOWN_EXERCISES: ExerciseEntry[] = [
  {
    name: 'Standing Quad Stretch', phase: 'cooldown', intensity: 'light', pattern: 'lunge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Stretches the front of your thighs after squats and lunges.',
    form_cue: 'Grab your ankle behind you, knees together, tall posture.',
    youtube_search_query: 'standing quad stretch',
  },
  {
    name: 'Standing Hamstring Stretch', phase: 'cooldown', intensity: 'light', pattern: 'hinge',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Relaxes hamstrings after any leg work.',
    form_cue: 'One heel forward on floor, hinge from hips, back flat.',
    youtube_search_query: 'standing hamstring stretch',
  },
  {
    name: 'Cross-Body Shoulder Stretch', phase: 'cooldown', intensity: 'light', pattern: 'push',
    uses_equipment: ['bodyweight'], avoid_injury: [], avoid_medical: [], approx_minutes: 1,
    sets: 1, reps: '30 sec each side', rpe: '3', rest_seconds: 0, hold_seconds: 30,
    why: 'Opens shoulders after pressing and rowing.',
    form_cue: 'Pull arm across chest with the opposite hand, feel a gentle stretch.',
    youtube_search_query: 'cross body shoulder stretch',
  },
  {
    name: 'Child\'s Pose', phase: 'cooldown', intensity: 'light', pattern: 'core',
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

const INTENSITY_RANK: Record<ExerciseIntensity, number> = { light: 0, medium: 1, heavy: 2 }

// `excludeNames` (optional) lets the caller enforce week-wide uniqueness by
// passing a set of exercise names that have already been used on other days.
export function pickExercises(
  patterns: Pattern[],
  equipment: Equipment[],
  injuries: Injury[],
  medical: MedicalCondition[],
  allowedIntensity: ExerciseIntensity[],
  noJumping = false,
  excludeNames?: Set<string>,
): Exercise[] {
  const allowedSet = new Set(allowedIntensity)
  const preferredRank = Math.max(...allowedIntensity.map((i) => INTENSITY_RANK[i]))
  const out: Exercise[] = []
  const usedThisDay = new Set<string>()
  for (const pat of patterns) {
    const candidates = EXERCISES.filter((e) => {
      if (e.pattern !== pat) return false
      if (usedThisDay.has(e.name)) return false
      if (excludeNames?.has(e.name)) return false     // week-wide dedup
      if (!allowedSet.has(e.intensity)) return false
      if (!e.uses_equipment.some((n) => equipment.includes(n))) return false
      if (e.avoid_injury.some((inj) => injuries.includes(inj))) return false
      if (e.avoid_medical.some((m) => medical.includes(m))) return false
      if (noJumping && /jump|jumping|burpee|box jump/i.test(e.name)) return false
      return true
    })
    if (candidates.length === 0) continue
    candidates.sort((a, b) => {
      const da = Math.abs(INTENSITY_RANK[a.intensity] - preferredRank)
      const db = Math.abs(INTENSITY_RANK[b.intensity] - preferredRank)
      return da - db
    })
    usedThisDay.add(candidates[0].name)
    out.push(toExercise(candidates[0]))
  }
  return out
}

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

export function trimToFit(exercises: Exercise[], targetMinutes: number, minKept = 2): Exercise[] {
  const ordered = [...exercises]
  let total = estimateMinutes(ordered)
  while (total > targetMinutes && ordered.length > minKept) {
    ordered.pop()
    total = estimateMinutes(ordered)
  }
  return ordered
}

export function padToMinimum(
  current: Exercise[],
  fallbackPatterns: Pattern[],
  equipment: Equipment[],
  injuries: Injury[],
  medical: MedicalCondition[],
  allowedIntensity: ExerciseIntensity[],
  minCount: number,
  noJumping = false,
  excludeNames?: Set<string>,
): Exercise[] {
  const out = [...current]
  const usedThisDay = new Set(out.map((e) => e.name))
  const softExcluded = new Set(excludeNames ?? [])
  const allowedSet = new Set(allowedIntensity)
  const fallbackAllowed = new Set<ExerciseIntensity>([...allowedIntensity, 'light'])

  function findPick(allowWeekRepeat: boolean): Exercise | null {
    for (const pat of fallbackPatterns) {
      const candidates = EXERCISES
        .filter((e) => e.pattern === pat)
        .filter((e) => !usedThisDay.has(e.name))
        .filter((e) => allowWeekRepeat || !softExcluded.has(e.name))
        .filter((e) => !e.avoid_injury.some((i) => injuries.includes(i)))
        .filter((e) => !e.avoid_medical.some((m) => medical.includes(m)))
        .filter((e) => !noJumping || !/jump|jumping|burpee|box jump/i.test(e.name))

      let pick = candidates.find((e) =>
        allowedSet.has(e.intensity) && e.uses_equipment.some((eq) => equipment.includes(eq)))
      if (!pick) pick = candidates.find((e) =>
        fallbackAllowed.has(e.intensity) && e.uses_equipment.includes('bodyweight'))
      if (pick) return toExercise(pick)
    }
    return null
  }

  // First pass: honour the week-wide dedup. Nothing repeats.
  while (out.length < minCount) {
    const pick = findPick(false)
    if (!pick) break
    out.push(pick)
    usedThisDay.add(pick.name)
  }
  // Second pass: if we're still short (inventory exhausted), allow week-wide
  // repeats — the 4-exercise floor beats strict uniqueness.
  while (out.length < minCount) {
    const pick = findPick(true)
    if (!pick) break
    out.push(pick)
    usedThisDay.add(pick.name)
  }
  return out
}

export type { ExercisePhase }
