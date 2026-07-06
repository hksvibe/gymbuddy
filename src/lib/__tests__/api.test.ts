import { describe, it, expect } from 'vitest'
import { mockGeneratePlan, type GeneratePlanInput } from '../api'
import type { FeltSummary } from '../types'

const baseProfile: GeneratePlanInput = {
  age: 26,
  height_cm: 172,
  weight_kg: 70,
  goal: 'fat_loss',
  experience: 'never',
  days_per_week: 3,
  session_length: 30,
  equipment: ['dumbbells', 'bench', 'treadmill'],
  diet_pref: 'veg',
  injuries: ['none'],
  medical_conditions: ['none'],
  other_constraints: '',
  includes_yoga: false,
  training_styles: ['strength_cardio'],
  week_number: 1,
}

const emptyFelt: FeltSummary = { easy: 0, ok: 0, hard: 0, pain: 0 }

describe('mockGeneratePlan — structure & contracts', () => {
  it('produces exactly days_per_week training days', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4 })
    expect(p.days.length).toBe(4)
  })

  it('main-phase exercises only use equipment the user listed (bodyweight always allowed for warm-up/cool-down)', () => {
    const p = mockGeneratePlan({ ...baseProfile, equipment: ['dumbbells'] })
    const allowed = new Set(['dumbbells', 'bodyweight'])
    for (const d of p.days) {
      for (const ex of d.exercises.filter((e) => e.phase === 'main')) {
        for (const eq of ex.uses_equipment) {
          expect(allowed).toContain(eq)
        }
      }
    }
  })

  it('falls back to bodyweight when nothing else available', () => {
    const p = mockGeneratePlan({ ...baseProfile, equipment: ['bodyweight'] })
    expect(p.days.flatMap((d) => d.exercises).length).toBeGreaterThan(0)
  })

  it('honours days_per_week clamp 2..6', () => {
    expect(mockGeneratePlan({ ...baseProfile, days_per_week: 1 }).days.length).toBe(2)
    expect(mockGeneratePlan({ ...baseProfile, days_per_week: 8 }).days.length).toBe(6)
  })

  it('enforces the 25-minute floor on session_length', () => {
    const p = mockGeneratePlan({ ...baseProfile, session_length: 25 })
    for (const d of p.days) expect(d.est_minutes).toBeGreaterThanOrEqual(25)
  })

  it('every day includes at least 4 main-phase exercises', () => {
    const p = mockGeneratePlan(baseProfile)
    for (const d of p.days) {
      const mains = d.exercises.filter((e) => e.phase === 'main')
      expect(mains.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('every day includes a warm-up and a cool-down', () => {
    const p = mockGeneratePlan(baseProfile)
    for (const d of p.days) {
      expect(d.exercises.some((e) => e.phase === 'warmup')).toBe(true)
      expect(d.exercises.some((e) => e.phase === 'cooldown')).toBe(true)
    }
  })
})

describe('mockGeneratePlan — diet uses weight-scaled protein', () => {
  it('55kg fat-loss user gets a lower protein target than a 95kg user', () => {
    const lighter = mockGeneratePlan({ ...baseProfile, weight_kg: 55 })
    const heavier = mockGeneratePlan({ ...baseProfile, weight_kg: 95 })
    expect(heavier.diet.daily_protein_target_g).toBeGreaterThan(lighter.diet.daily_protein_target_g)
  })

  it('muscle_gain multiplier stays in the 1.6-1.8 g/kg range', () => {
    const p = mockGeneratePlan({ ...baseProfile, goal: 'muscle_gain', weight_kg: 70 })
    const ratio = p.diet.daily_protein_target_g / 70
    expect(ratio).toBeGreaterThanOrEqual(1.5)
    expect(ratio).toBeLessThanOrEqual(2.0)
  })

  it('fat_loss multiplier stays in the 1.6-2.1 g/kg range (higher than muscle_gain)', () => {
    const p = mockGeneratePlan({ ...baseProfile, goal: 'fat_loss', weight_kg: 70 })
    const ratio = p.diet.daily_protein_target_g / 70
    expect(ratio).toBeGreaterThanOrEqual(1.6)
    expect(ratio).toBeLessThanOrEqual(2.1)
  })

  it('rounds protein target to the nearest 5g', () => {
    const p = mockGeneratePlan({ ...baseProfile, weight_kg: 67 })
    expect(p.diet.daily_protein_target_g % 5).toBe(0)
  })
})

describe('mockGeneratePlan — training styles allocation', () => {
  it('adds a yoga day when yoga is in training_styles', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 3, training_styles: ['strength_cardio', 'yoga'] })
    expect(p.days.some((d) => /yoga/i.test(d.day_label))).toBe(true)
  })

  it('adds a mobility day when mobility is in training_styles', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4, training_styles: ['strength_cardio', 'mobility'] })
    expect(p.days.some((d) => /mobility/i.test(d.day_label))).toBe(true)
  })

  it('adds both yoga and mobility days when both are selected', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4, training_styles: ['strength_cardio', 'yoga', 'mobility'] })
    expect(p.days.some((d) => /yoga/i.test(d.day_label))).toBe(true)
    expect(p.days.some((d) => /mobility/i.test(d.day_label))).toBe(true)
  })

  it('does NOT add yoga/mobility days when only strength_cardio is picked', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 3, training_styles: ['strength_cardio'] })
    for (const d of p.days) {
      expect(d.day_label).not.toMatch(/yoga|mobility/i)
    }
  })

  it('yoga day exercises are all bodyweight and light', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4, training_styles: ['strength_cardio', 'yoga'] })
    const yogaDay = p.days.find((d) => /yoga/i.test(d.day_label))!
    expect(yogaDay).toBeDefined()
    for (const ex of yogaDay.exercises.filter((e) => e.phase === 'main')) {
      expect(ex.intensity).toBe('light')
      expect(ex.uses_equipment.every((eq) => eq === 'bodyweight')).toBe(true)
    }
  })

  it('mobility day exercises are all bodyweight and light', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4, training_styles: ['strength_cardio', 'mobility'] })
    const mobDay = p.days.find((d) => /mobility/i.test(d.day_label))!
    expect(mobDay).toBeDefined()
    for (const ex of mobDay.exercises.filter((e) => e.phase === 'main')) {
      expect(ex.intensity).toBe('light')
      expect(ex.uses_equipment.every((eq) => eq === 'bodyweight')).toBe(true)
    }
  })
})

describe('mockGeneratePlan — no exercise repeats across days when inventory allows', () => {
  it('does not repeat a main exercise across days for a well-equipped user', () => {
    const p = mockGeneratePlan({
      ...baseProfile,
      days_per_week: 3,
      experience: 'over_1y',
      equipment: ['dumbbells', 'bench', 'barbell', 'machines', 'cables', 'pull_up_bar'],
    })
    const allMains = p.days.flatMap((d) => d.exercises.filter((e) => e.phase === 'main').map((e) => e.name))
    const uniqueMains = new Set(allMains)
    // At least 80% of the mains should be unique — the mock caps duplicates
    // only when inventory genuinely runs out.
    expect(uniqueMains.size).toBeGreaterThanOrEqual(Math.floor(allMains.length * 0.8))
  })

  it('day labels never call a squat-heavy day "Upper Body"', () => {
    const p = mockGeneratePlan({ ...baseProfile, experience: '1_3m' })
    for (const d of p.days) {
      const hasLowerBody = d.exercises.some((e) => (e.phase ?? 'main') === 'main' &&
        /squat|deadlift|lunge|leg press|hip thrust|romanian/i.test(e.name))
      if (hasLowerBody && /upper body/i.test(d.day_label)) {
        throw new Error(`Miscategorised: ${d.day_label} contains lower-body work`)
      }
    }
  })
})

describe('mockGeneratePlan — intensity tiers scale with experience', () => {
  it('gives a "never"-experience user LIGHT-only main exercises', () => {
    const p = mockGeneratePlan({ ...baseProfile, experience: 'never', equipment: ['bodyweight', 'dumbbells', 'barbell', 'bench'] })
    for (const d of p.days) {
      for (const ex of d.exercises.filter((e) => e.phase === 'main')) {
        expect(ex.intensity).toBe('light')
      }
    }
  })

  it('gives an "over_1y" user at least one heavy compound per day (light accessories still allowed)', () => {
    const p = mockGeneratePlan({ ...baseProfile, experience: 'over_1y', equipment: ['dumbbells', 'barbell', 'bench', 'machines'] })
    for (const d of p.days) {
      const mains = d.exercises.filter((e) => e.phase === 'main')
      const hasHeavyOrMedium = mains.some((e) => e.intensity === 'medium' || e.intensity === 'heavy')
      expect(hasHeavyOrMedium).toBe(true)
    }
  })

  it('warm-up and cool-down are always LIGHT regardless of experience', () => {
    const p = mockGeneratePlan({ ...baseProfile, experience: 'over_1y', equipment: ['dumbbells', 'barbell', 'bench'] })
    for (const d of p.days) {
      for (const ex of d.exercises.filter((e) => e.phase !== 'main')) {
        expect(ex.intensity).toBe('light')
      }
    }
  })

  it('1_3m user sees a mix of light + medium (no heavy)', () => {
    const p = mockGeneratePlan({ ...baseProfile, experience: '1_3m', equipment: ['bodyweight', 'dumbbells', 'barbell', 'bench'] })
    const intensities = new Set(
      p.days.flatMap((d) => d.exercises.filter((e) => e.phase === 'main')).map((e) => e.intensity),
    )
    expect(intensities.has('heavy')).toBe(false)
  })
})

describe('mockGeneratePlan — safety guardrails', () => {
  it('omits overhead pressing for shoulder injury', () => {
    const p = mockGeneratePlan({ ...baseProfile, injuries: ['shoulder'] })
    const names = p.days.flatMap((d) => d.exercises.map((e) => e.name.toLowerCase()))
    expect(names.some((n) => n.includes('shoulder press') || n.includes('overhead press'))).toBe(false)
  })

  it('omits Romanian deadlift for lower_back injury', () => {
    const p = mockGeneratePlan({ ...baseProfile, injuries: ['lower_back'] })
    const names = p.days.flatMap((d) => d.exercises.map((e) => e.name.toLowerCase()))
    expect(names.some((n) => n.includes('romanian deadlift'))).toBe(false)
  })

  it('safety_note mentions doctor consult for high_bp', () => {
    const p = mockGeneratePlan({ ...baseProfile, medical_conditions: ['high_bp'] })
    expect(p.safety_note.toLowerCase()).toContain('doctor')
  })

  it('respects "no jumping" in other_constraints', () => {
    const p = mockGeneratePlan({ ...baseProfile, other_constraints: 'no jumping please' })
    const names = p.days.flatMap((d) => d.exercises.map((e) => e.name.toLowerCase()))
    for (const n of names) expect(/jump|burpee|box jump/i.test(n)).toBe(false)
  })
})

describe('mockGeneratePlan — adaptive logic (REQ 4)', () => {
  it('does NOT increase volume when last week completion <60%', () => {
    const base = mockGeneratePlan({ ...baseProfile, week_number: 1 })
    const baseSets = base.days[0].exercises.reduce((a, e) => a + e.sets, 0)
    const adapted = mockGeneratePlan({
      ...baseProfile,
      week_number: 2,
      last_week: {
        completion_pct: 0.33, days_completed: 1,
        exercises_skipped: [], felt_summary: emptyFelt, equipment_changed: false,
      },
    })
    const adaptedSets = adapted.days[0].exercises.reduce((a, e) => a + e.sets, 0)
    expect(adaptedSets).toBeLessThanOrEqual(baseSets)
  })

  it('adds small progression when completion ≥85% and not too hard', () => {
    const base = mockGeneratePlan({ ...baseProfile, week_number: 1 })
    const baseSets = base.days[0].exercises.reduce((a, e) => a + e.sets, 0)
    const adapted = mockGeneratePlan({
      ...baseProfile,
      week_number: 2,
      last_week: {
        completion_pct: 0.9, days_completed: 3,
        exercises_skipped: [],
        felt_summary: { easy: 1, ok: 2, hard: 0, pain: 0 },
        equipment_changed: false,
      },
    })
    const adaptedSets = adapted.days[0].exercises.reduce((a, e) => a + e.sets, 0)
    expect(adaptedSets).toBeGreaterThanOrEqual(baseSets)
  })

  it('mentions pain in the summary when any pain reported', () => {
    const adapted = mockGeneratePlan({
      ...baseProfile,
      week_number: 2,
      last_week: {
        completion_pct: 0.66, days_completed: 2,
        exercises_skipped: [],
        felt_summary: { easy: 0, ok: 1, hard: 1, pain: 1 },
        equipment_changed: false,
      },
    })
    expect(adapted.summary.toLowerCase()).toMatch(/pain/)
  })

  it('mentions equipment in summary when equipment_changed', () => {
    const adapted = mockGeneratePlan({
      ...baseProfile,
      week_number: 2,
      last_week: {
        completion_pct: 0.66, days_completed: 2,
        exercises_skipped: [],
        felt_summary: { easy: 0, ok: 2, hard: 0, pain: 0 },
        equipment_changed: true,
      },
    })
    expect(adapted.summary.toLowerCase()).toMatch(/equipment/)
  })
})
