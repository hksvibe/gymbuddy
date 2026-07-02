import { describe, it, expect } from 'vitest'
import { mockGeneratePlan, type GeneratePlanInput } from '../api'
import type { FeltSummary } from '../types'

const baseProfile: GeneratePlanInput = {
  age: 26,
  goal: 'fat_loss',
  experience: 'never',
  days_per_week: 3,
  session_length: 30,
  equipment: ['dumbbells', 'bench', 'treadmill'],
  diet_pref: 'veg',
  injuries: ['none'],
  medical_conditions: ['none'],
  other_constraints: '',
  week_number: 1,
}

const emptyFelt: FeltSummary = { easy: 0, ok: 0, hard: 0, pain: 0 }

describe('mockGeneratePlan — structure & contracts', () => {
  it('produces exactly days_per_week training days', () => {
    const p = mockGeneratePlan({ ...baseProfile, days_per_week: 4 })
    expect(p.days.length).toBe(4)
  })

  it('only uses equipment the user listed', () => {
    const p = mockGeneratePlan({ ...baseProfile, equipment: ['dumbbells'] })
    for (const d of p.days) {
      for (const ex of d.exercises) {
        for (const eq of ex.uses_equipment) {
          expect(['dumbbells']).toContain(eq)
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

  it('fits each day under session_length', () => {
    const p = mockGeneratePlan({ ...baseProfile, session_length: 20 })
    for (const d of p.days) expect(d.est_minutes).toBeLessThanOrEqual(20)
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
