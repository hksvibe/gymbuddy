import type { DietPref, Goal, Meal } from '../lib/types'

export function mealsFor(diet: DietPref): Meal[] {
  if (diet === 'veg') {
    return [
      { name: 'Breakfast', idea: 'Besan chilla (2) + curd (1 bowl)', approx_protein_g: 22 },
      { name: 'Lunch', idea: 'Rajma + rice + cucumber salad', approx_protein_g: 25 },
      { name: 'Dinner', idea: 'Paneer bhurji (100g) + 2 roti', approx_protein_g: 28 },
    ]
  }
  if (diet === 'egg_veg') {
    return [
      { name: 'Breakfast', idea: '3 boiled eggs + 2 multigrain toast', approx_protein_g: 24 },
      { name: 'Lunch', idea: 'Dal + brown rice + paneer cubes (50g)', approx_protein_g: 28 },
      { name: 'Dinner', idea: 'Egg bhurji (3 eggs) + 2 roti + dahi', approx_protein_g: 30 },
    ]
  }
  return [
    { name: 'Breakfast', idea: '3 boiled eggs + 2 toast + banana', approx_protein_g: 24 },
    { name: 'Lunch', idea: 'Chicken curry (150g) + rice + salad', approx_protein_g: 38 },
    { name: 'Dinner', idea: 'Grilled chicken/fish (150g) + 2 roti', approx_protein_g: 38 },
  ]
}

// Grams of protein per kg of body weight, tuned by goal.
// Evidence-based ranges from ISSN / ACSM position papers for beginners:
//  - muscle_gain / strength → 1.6–2.0 g/kg to support hypertrophy
//  - fat_loss              → 1.8–2.4 g/kg to preserve lean mass during deficit
//  - general_fitness       → 1.2–1.6 g/kg maintenance
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  muscle_gain: 1.7,
  strength: 1.7,
  fat_loss: 1.8,
  general_fitness: 1.4,
}

// Returns a rough daily protein target in grams, rounded to the nearest 5g.
// Clamps to a sane range so unusual weights don't produce absurd targets.
export function proteinTargetFor(goal: Goal, weight_kg: number): number {
  const multiplier = PROTEIN_G_PER_KG[goal] ?? 1.4
  const raw = weight_kg * multiplier
  const rounded = Math.round(raw / 5) * 5
  return Math.max(40, Math.min(220, rounded))
}

// BMI, for optional context in the plan summary. Non-medical.
export function bmi(weight_kg: number, height_cm: number): number {
  if (!height_cm) return 0
  const h = height_cm / 100
  return Math.round((weight_kg / (h * h)) * 10) / 10
}
