// Roll a week's check-ins + the prior plan's equipment snapshot into a
// LastWeekSummary that feeds the next generatePlan call.

import type { Checkin, Equipment, FeltSummary, LastWeekSummary } from './types'

export function feltSummary(checkins: Checkin[]): FeltSummary {
  const s: FeltSummary = { easy: 0, ok: 0, hard: 0, pain: 0 }
  for (const c of checkins) {
    if (c.felt) s[c.felt]++
  }
  return s
}

export function buildLastWeekSummary(args: {
  checkins: Checkin[]
  days_planned: number
  previous_equipment: Equipment[]
  current_equipment: Equipment[]
}): LastWeekSummary {
  const { checkins, days_planned, previous_equipment, current_equipment } = args
  const days_completed = new Set(checkins.map((c) => c.day_label)).size
  const completion_pct = days_planned > 0 ? days_completed / days_planned : 0
  const exercises_skipped = Array.from(new Set(checkins.flatMap((c) => c.exercises_skipped)))
  const equipment_changed = !arrayEq(previous_equipment, current_equipment)
  return {
    completion_pct,
    days_completed,
    exercises_skipped,
    felt_summary: feltSummary(checkins),
    equipment_changed,
  }
}

function arrayEq(a: Equipment[], b: Equipment[]) {
  if (a.length !== b.length) return false
  const sa = [...a].sort(), sb = [...b].sort()
  return sa.every((x, i) => x === sb[i])
}
