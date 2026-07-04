import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { callGroq } from './groq.js'

const groqKey = defineSecret('GROQ_API_KEY')

// Verbatim from the GymBuddy-for-Claude spec — with the newer safety + structure
// rules layered on top. Do not paraphrase without updating the client mock too.
const SYSTEM_PROMPT = `You are a certified beginner-focused fitness coach for Indian budget / society-gym users.

Generate a SAFE, SIMPLE weekly workout plan tailored to the user.

You MUST respect ALL of these simultaneously:
- EQUIPMENT: use ONLY equipment in the provided list. If a movement needs gear they lack, substitute one that uses what they have (or bodyweight).
- AGE, HEIGHT, WEIGHT: scale volume/complexity to age; use weight to set a realistic daily protein target (see DIET). BMI is informational only.
- EXPERIENCE: beginners get simple foundational movements.
- GOAL: bias toward goal (fat_loss → compounds + light conditioning; muscle_gain → hypertrophy reps; strength → compound focus, beginner-safe; general_fitness → balanced).
- MEDICAL & INJURIES (hard safety): lower_back → avoid loaded spinal flexion; knee → avoid deep loaded knee flexion; shoulder → avoid heavy overhead. high_bp/heart_condition/asthma → low intensity, no breath-holding/straining, add "consult a doctor". pregnancy → avoid supine after first trimester and high-impact; recommend professional guidance.
- SESSION LENGTH: MINIMUM 25 minutes per session. Fit warm-up + main + cool-down inside the requested session_length (25, 30, or 45 minutes).
- OTHER CONSTRAINTS: honor free-text constraints (e.g. "no jumping", "evenings only").
- DAYS/WEEK: produce exactly days_per_week training days with a simple beginner split.

STRUCTURE FOR EVERY DAY (this is mandatory):
- Start with a DYNAMIC warm-up: 3-4 short movements (marching, arm circles, hip circles, squat-to-reach, etc.) totalling ~4 minutes. Each has phase="warmup".
- Then a MAIN block: AT LEAST 4 exercises, each phase="main". These are the actual training work.
- End with a STATIC stretch / cool-down: 3-4 hold-based stretches (quad, hamstring, shoulder, child's pose, etc.) totalling ~4 minutes. Each has phase="cooldown".

Intensity: moderate reps (8-15), RPE 6-7. Never prescribe 1-rep-max or near-max lifts.

For EACH exercise include: name, phase, sets, reps, rpe, one-line "why", short form_cue, youtube_search_query, uses_equipment (subset of the input equipment), safe_for_user, and TIMING:
- rest_seconds: rest between sets (30-60 for main-phase strength; 0 for warm-up / cool-down)
- hold_seconds: how long to hold (planks, stretches). Omit for rep-based lifts.

DIET (mandatory shape):
- Rough daily protein target in grams tuned to weight_kg × goal-specific multiplier:
    muscle_gain / strength → 1.6-1.8 g/kg
    fat_loss              → 1.8-2.0 g/kg (preserves lean mass in a deficit)
    general_fitness       → 1.2-1.4 g/kg
  Round to the nearest 5g.
- Exactly 3 budget, common Indian meals matching diet_pref. For EACH meal include:
    name (Breakfast | Lunch | Dinner)
    idea (short description, e.g. "Besan chilla + curd")
    approx_protein_g (integer)
    approx_kcal (integer)
    prep_minutes (integer)
    ingredients: array of strings with quantities (e.g. "1 cup besan (chickpea flour)", "1 chopped onion")
    recipe: array of ordered short cooking steps (5-7 steps, beginner-friendly)

ADAPTATION (if last_week provided):
- Keep completed exercises; swap/simplify repeatedly-skipped ones.
- completion_pct < 60% → do NOT increase difficulty; reduce volume slightly; stay encouraging.
- Frequent felt="hard" → ease off; "easy" → small progression (compounds only); any "pain" → remove/replace that pattern + caution note.
- If equipment changed → rebuild around the NEW equipment list.

Output ONLY valid JSON matching the schema. No prose outside JSON.

Output schema:
{
  "week_number": <int>,
  "summary": "<1-2 line encouraging note referencing what changed>",
  "days": [{
    "day_label": "Day N - <name>",
    "focus": "<short focus>",
    "est_minutes": <int, at least 25>,
    "exercises": [{
      "name": "<exercise name>",
      "phase": "warmup" | "main" | "cooldown",
      "sets": <int>,
      "reps": "<string e.g. 10-12 or 30 sec>",
      "rpe": "<string e.g. 6-7>",
      "why": "<one line>",
      "form_cue": "<short cue>",
      "youtube_search_query": "<search string>",
      "video_id": null,
      "uses_equipment": ["<equipment ids from input>"],
      "safe_for_user": <bool>,
      "rest_seconds": <int>,
      "hold_seconds": <int, optional>
    }]
  }],
  "diet": {
    "daily_protein_target_g": <int>,
    "meals": [{
      "name": "Breakfast|Lunch|Dinner",
      "idea": "<meal>",
      "approx_protein_g": <int>,
      "approx_kcal": <int>,
      "prep_minutes": <int>,
      "ingredients": ["<qty + item>", "..."],
      "recipe": ["<step>", "..."]
    }]
  },
  "safety_note": "<one line>"
}`

interface PlanInput {
  age: number
  height_cm: number
  weight_kg: number
  goal: string
  experience: string
  days_per_week: number
  session_length: number
  equipment: string[]
  diet_pref: string
  injuries: string[]
  medical_conditions: string[]
  other_constraints: string
  week_number: number
  last_week?: {
    completion_pct: number
    days_completed: number
    exercises_skipped: string[]
    felt_summary: { easy: number; ok: number; hard: number; pain: number }
    equipment_changed: boolean
  }
}

interface Exercise {
  name: string
  phase: 'warmup' | 'main' | 'cooldown'
  sets: number
  reps: string
  rpe: string
  why: string
  form_cue: string
  youtube_search_query: string
  video_id: string | null
  uses_equipment: string[]
  safe_for_user: boolean
  rest_seconds?: number
  hold_seconds?: number
}

interface Meal {
  name: string
  idea: string
  approx_protein_g: number
  approx_kcal?: number
  prep_minutes?: number
  ingredients: string[]
  recipe: string[]
}

interface PlanJSON {
  week_number: number
  summary: string
  days: Array<{
    day_label: string
    focus: string
    est_minutes: number
    exercises: Exercise[]
  }>
  diet: { daily_protein_target_g: number; meals: Meal[] }
  safety_note: string
}

export function tryParse(raw: string): PlanJSON | null {
  let cleaned = raw.trim()
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) cleaned = fence[1].trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first === -1 || last === -1) return null
  const candidate = cleaned.slice(first, last + 1)
  try {
    const parsed = JSON.parse(candidate) as PlanJSON
    if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) return null
    if (!parsed.diet || !Array.isArray(parsed.diet.meals)) return null
    for (const d of parsed.days) {
      if (!Array.isArray(d.exercises)) return null
      const mains = d.exercises.filter((e) => e.phase === 'main')
      // Minimum 4 main exercises per day.
      if (mains.length < 4) return null
      for (const e of d.exercises) {
        if (typeof e.name !== 'string' || typeof e.sets !== 'number') return null
        if (typeof e.youtube_search_query !== 'string') return null
      }
    }
    for (const m of parsed.diet.meals) {
      if (!Array.isArray(m.ingredients) || m.ingredients.length === 0) return null
      if (!Array.isArray(m.recipe) || m.recipe.length === 0) return null
    }
    return parsed
  } catch {
    return null
  }
}

function validateInput(input: unknown): asserts input is PlanInput {
  const i = input as PlanInput
  if (!i || typeof i !== 'object') throw new HttpsError('invalid-argument', 'missing input')
  if (typeof i.goal !== 'string') throw new HttpsError('invalid-argument', 'goal required')
  if (typeof i.experience !== 'string') throw new HttpsError('invalid-argument', 'experience required')
  if (typeof i.height_cm !== 'number' || i.height_cm < 120 || i.height_cm > 230)
    throw new HttpsError('invalid-argument', 'height_cm must be 120-230')
  if (typeof i.weight_kg !== 'number' || i.weight_kg < 30 || i.weight_kg > 250)
    throw new HttpsError('invalid-argument', 'weight_kg must be 30-250')
  if (typeof i.days_per_week !== 'number' || i.days_per_week < 2 || i.days_per_week > 6)
    throw new HttpsError('invalid-argument', 'days_per_week must be 2-6')
  if (typeof i.session_length !== 'number' || ![25, 30, 45].includes(i.session_length))
    throw new HttpsError('invalid-argument', 'session_length must be 25|30|45')
  if (!Array.isArray(i.equipment)) throw new HttpsError('invalid-argument', 'equipment required')
  if (typeof i.diet_pref !== 'string') throw new HttpsError('invalid-argument', 'diet_pref required')
  if (!Array.isArray(i.injuries)) throw new HttpsError('invalid-argument', 'injuries required')
  if (!Array.isArray(i.medical_conditions))
    throw new HttpsError('invalid-argument', 'medical_conditions required')
  if (typeof i.week_number !== 'number') throw new HttpsError('invalid-argument', 'week_number required')
}

export const generatePlan = onCall(
  { secrets: [groqKey], region: 'asia-south1', cors: true },
  async (req) => {
    validateInput(req.data)
    const input = req.data as PlanInput

    const apiKey = groqKey.value()
    if (!apiKey) throw new HttpsError('failed-precondition', 'GROQ_API_KEY not configured')

    const userMessage =
      `Generate the plan for this user. Respond with ONLY valid JSON, no preamble. Remember: every day needs warm-up + at least 4 main exercises + cool-down; every meal needs ingredients and a recipe.\n\n${JSON.stringify(input, null, 2)}`

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await callGroq({
          apiKey,
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 6000,     // higher because we're now emitting recipes per meal
          json_object: true,
        })
        const parsed = tryParse(raw)
        if (parsed) return parsed
        logger.warn('Malformed plan JSON, retrying', { attempt, sample: raw.slice(0, 200) })
      } catch (e) {
        logger.error('Groq call failed', { attempt, error: String(e) })
        if (attempt === 1) throw new HttpsError('internal', 'plan generation failed')
      }
    }
    throw new HttpsError('internal', 'plan generation returned malformed output')
  },
)
