// Regenerate this week's plan while preserving days the user has already
// checked in for. Called from My Gym after the user changes their training
// styles (or equipment, or any profile field that shifts programming).

import { generatePlan, profileToInput } from './api'
import { checkinsForWeek, latestPlan, savePlan } from './storage'
import { logEvent } from './analytics'
import type { Plan, UserProfile } from './types'

export interface RegenerateResult {
  newPlan: Plan
  preservedDayLabels: string[]
  replacedDayLabels: string[]
}

export async function regenerateWeekPreservingCompleted(
  profile: UserProfile,
): Promise<RegenerateResult> {
  const current = await latestPlan()
  if (!current) throw new Error('no current plan to regenerate')

  const checkins = await checkinsForWeek(current.week_number)
  const completedLabels = new Set(checkins.map((c) => c.day_label))

  // Generate a fresh plan against the updated profile.
  const fresh = await generatePlan(profileToInput(profile, current.week_number))

  // Merge day-by-day: keep old days the user already trained (identified by
  // day_label). For every other slot, take the fresh day at the same index.
  const preserved: string[] = []
  const replaced: string[] = []
  const mergedDays = current.plan_json.days.map((oldDay, i) => {
    if (completedLabels.has(oldDay.day_label)) {
      preserved.push(oldDay.day_label)
      return oldDay
    }
    const freshDay = fresh.days[i] ?? fresh.days[fresh.days.length - 1]
    replaced.push(freshDay.day_label)
    return freshDay
  })

  const mergedPlanJson = {
    ...fresh,
    days: mergedDays,
  }

  const saved = await savePlan({
    week_number: current.week_number,
    equipment_snapshot: profile.equipment,
    plan_json: mergedPlanJson,
    source: 'adaptive',
  })

  logEvent('plan_regenerated', {
    week_number: current.week_number,
    preserved_days: preserved.length,
    replaced_days: replaced.length,
  })

  return { newPlan: saved, preservedDayLabels: preserved, replacedDayLabels: replaced }
}
