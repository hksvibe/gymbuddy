import { describe, it, expect } from 'vitest'
import { buildLastWeekSummary, feltSummary } from '../adaptive'
import type { Checkin } from '../types'

function ck(partial: Partial<Checkin>): Checkin {
  return {
    id: 'x', user_id: 'u', plan_id: 'p', week_number: 1,
    day_label: 'Day 1 - Full Body A', checked_in_at: new Date().toISOString(),
    exercises_done: [], exercises_skipped: [],
    ...partial,
  }
}

describe('feltSummary', () => {
  it('counts each felt bucket', () => {
    const s = feltSummary([
      ck({ felt: 'easy' }),
      ck({ felt: 'ok' }),
      ck({ felt: 'hard' }),
      ck({ felt: 'hard' }),
    ])
    expect(s).toEqual({ easy: 1, ok: 1, hard: 2, pain: 0 })
  })
  it('ignores missing felt', () => {
    const s = feltSummary([ck({}), ck({ felt: 'ok' })])
    expect(s).toEqual({ easy: 0, ok: 1, hard: 0, pain: 0 })
  })
})

describe('buildLastWeekSummary', () => {
  it('computes completion_pct = unique day_labels with checkin / days_planned', () => {
    const checkins = [
      ck({ day_label: 'Day 1 - A' }),
      ck({ day_label: 'Day 1 - A' }),       // duplicate same day, shouldn't double-count
      ck({ day_label: 'Day 2 - B' }),
    ]
    const r = buildLastWeekSummary({
      checkins, days_planned: 3,
      previous_equipment: ['dumbbells'], current_equipment: ['dumbbells'],
    })
    expect(r.days_completed).toBe(2)
    expect(r.completion_pct).toBeCloseTo(2 / 3)
  })

  it('dedupes exercises_skipped across check-ins', () => {
    const r = buildLastWeekSummary({
      checkins: [
        ck({ exercises_skipped: ['Walking Lunge'] }),
        ck({ exercises_skipped: ['Walking Lunge', 'Plank'] }),
      ],
      days_planned: 3,
      previous_equipment: [], current_equipment: [],
    })
    expect(r.exercises_skipped.sort()).toEqual(['Plank', 'Walking Lunge'])
  })

  it('detects equipment_changed regardless of order', () => {
    const r = buildLastWeekSummary({
      checkins: [],
      days_planned: 3,
      previous_equipment: ['dumbbells', 'bench'],
      current_equipment: ['bench', 'dumbbells'],
    })
    expect(r.equipment_changed).toBe(false)
  })

  it('flags equipment_changed when contents differ', () => {
    const r = buildLastWeekSummary({
      checkins: [],
      days_planned: 3,
      previous_equipment: ['dumbbells'],
      current_equipment: ['dumbbells', 'bench'],
    })
    expect(r.equipment_changed).toBe(true)
  })
})
