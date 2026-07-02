import type { DietPref, Meal } from '../lib/types'

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

export function proteinTargetFor(goal: string, _weightUnknown = true): number {
  if (goal === 'muscle_gain' || goal === 'strength') return 110
  if (goal === 'fat_loss') return 95
  return 85
}
