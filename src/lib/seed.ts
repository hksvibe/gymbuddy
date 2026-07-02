// One-tap demo data: a fully-populated user matching the spec's example
// (fat_loss / beginner / 3d / 30min / dumbbells+bench+treadmill+cables / veg / lower_back + high_bp),
// with Week 1 plan + 2 check-ins so Review/Progress flows look real immediately.

import { saveProfile, savePlan, saveCheckin, wipeLocal } from './storage'
import { generatePlan, profileToInput } from './api'

export async function seedDemo() {
  await wipeLocal()
  const profile = await saveProfile({
    name: 'Rohan',
    age: 26,
    city: 'Pune',
    goal: 'fat_loss',
    experience: 'never',
    days_per_week: 3,
    session_length: 30,
    equipment: ['dumbbells', 'bench', 'treadmill', 'cables'],
    equipment_source: 'manual',
    equipment_photo_urls: [],
    diet_pref: 'veg',
    injuries: ['lower_back'],
    medical_conditions: ['high_bp'],
    other_constraints: 'evenings only, no jumping',
    current_week: 1,
  })
  const planJson = await generatePlan(profileToInput(profile, 1))
  const plan = await savePlan({
    week_number: 1,
    equipment_snapshot: profile.equipment,
    plan_json: planJson,
    source: 'initial',
  })

  // Two completed sessions: Day 1 fully done (felt ok), Day 2 partially done with one skipped (felt hard).
  const d1 = plan.plan_json.days[0]
  const d2 = plan.plan_json.days[1]
  if (d1) {
    await saveCheckin({
      plan_id: plan.id,
      week_number: 1,
      day_label: d1.day_label,
      exercises_done: d1.exercises.map((e) => e.name),
      exercises_skipped: [],
      felt: 'ok',
    })
  }
  if (d2) {
    const exNames = d2.exercises.map((e) => e.name)
    const skipped = exNames.slice(-1)
    await saveCheckin({
      plan_id: plan.id,
      week_number: 1,
      day_label: d2.day_label,
      exercises_done: exNames.slice(0, -1),
      exercises_skipped: skipped,
      felt: 'hard',
      note: 'felt heavier today',
    })
  }
}
