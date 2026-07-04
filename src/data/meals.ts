import type { DietPref, Goal, Meal } from '../lib/types'

// Each entry has ingredients (with quantities) + step-by-step recipe.
// Kept beginner-friendly and budget-conscious for Indian home cooking.

const VEG_MEALS: Meal[] = [
  {
    name: 'Breakfast',
    idea: 'Besan chilla with curd',
    approx_protein_g: 22,
    approx_kcal: 380,
    prep_minutes: 15,
    ingredients: [
      '1 cup besan (chickpea flour)',
      '¾ cup water',
      '1 chopped onion',
      '1 chopped tomato',
      '1 chopped green chilli (optional)',
      '½ tsp turmeric',
      '½ tsp ajwain (carom seeds)',
      'Salt to taste',
      '1 tsp oil',
      '1 bowl (150g) plain curd on the side',
    ],
    recipe: [
      'In a bowl, whisk besan with water until smooth — no lumps.',
      'Add onion, tomato, green chilli, turmeric, ajwain, and salt. Mix well.',
      'Heat a non-stick tawa on medium, brush with a little oil.',
      'Pour a ladle of batter and spread into a thin circle.',
      'Cook 2 minutes until edges lift, then flip and cook 1 more minute.',
      'Serve hot with a bowl of chilled curd on the side.',
    ],
  },
  {
    name: 'Lunch',
    idea: 'Rajma-chawal with cucumber salad',
    approx_protein_g: 25,
    approx_kcal: 520,
    prep_minutes: 30,
    ingredients: [
      '1 cup boiled rajma (kidney beans) — soak overnight',
      '¾ cup basmati or brown rice',
      '1 chopped onion',
      '1 chopped tomato (or ½ cup puree)',
      '1 tsp ginger-garlic paste',
      '1 tsp cumin seeds',
      '1 tsp coriander powder',
      '½ tsp garam masala',
      '1 tbsp oil',
      'Salt to taste',
      '1 cucumber, 1 tomato, 1 onion for salad',
      'Lemon juice + salt for salad',
    ],
    recipe: [
      'Cook the rice with 1.5 cups of water in a pressure cooker for 2 whistles.',
      'Heat oil in a pan, add cumin. When it splutters, add onion and cook until golden.',
      'Add ginger-garlic paste, tomato, coriander powder, salt. Cook until oil separates.',
      'Add boiled rajma with 1 cup of the boiling water. Simmer 10 minutes.',
      'Sprinkle garam masala. Adjust salt.',
      'Chop cucumber, tomato, onion for salad. Toss with lemon juice and salt.',
      'Serve rajma over rice with the salad on the side.',
    ],
  },
  {
    name: 'Dinner',
    idea: 'Paneer bhurji with 2 rotis',
    approx_protein_g: 28,
    approx_kcal: 480,
    prep_minutes: 20,
    ingredients: [
      '150g paneer, crumbled',
      '1 chopped onion',
      '1 chopped tomato',
      '1 chopped green chilli (optional)',
      '½ tsp ginger-garlic paste',
      '½ tsp turmeric',
      '½ tsp cumin powder',
      '½ tsp garam masala',
      '1 tbsp oil',
      'Salt + fresh coriander',
      '2 whole-wheat rotis',
    ],
    recipe: [
      'Heat oil in a pan, add onion, cook until soft.',
      'Add ginger-garlic paste, green chilli, tomato. Cook 3 minutes.',
      'Add turmeric, cumin powder, salt. Mix.',
      'Add crumbled paneer, toss for 2 minutes on medium heat.',
      'Sprinkle garam masala and chopped coriander.',
      'Serve hot with warm rotis.',
    ],
  },
]

const EGG_VEG_MEALS: Meal[] = [
  {
    name: 'Breakfast',
    idea: '3 boiled eggs + 2 multigrain toast',
    approx_protein_g: 24,
    approx_kcal: 400,
    prep_minutes: 12,
    ingredients: [
      '3 whole eggs',
      '2 slices multigrain bread',
      '½ tsp salt',
      '¼ tsp black pepper',
      '1 tsp butter or oil (optional)',
    ],
    recipe: [
      'Place eggs in a pan, cover with cold water.',
      'Bring to a boil, then simmer for 8 minutes.',
      'Transfer to cold water for 2 minutes, then peel.',
      'Toast the bread while eggs cool.',
      'Slice eggs, sprinkle salt and pepper. Serve with toast.',
    ],
  },
  {
    name: 'Lunch',
    idea: 'Dal-brown rice with paneer cubes',
    approx_protein_g: 28,
    approx_kcal: 540,
    prep_minutes: 30,
    ingredients: [
      '¾ cup toor or moong dal',
      '¾ cup brown rice',
      '50g paneer cubes',
      '1 chopped onion',
      '1 chopped tomato',
      '1 tsp cumin seeds',
      '½ tsp turmeric',
      '1 tsp ginger-garlic paste',
      '1 tbsp oil or ghee',
      'Salt + coriander',
    ],
    recipe: [
      'Pressure cook dal with 2 cups water, turmeric, salt for 3 whistles.',
      'Cook brown rice with 1.5 cups water — 2 whistles.',
      'Heat oil in a pan, add cumin, then onion. Cook until golden.',
      'Add ginger-garlic paste and tomato. Cook 3 minutes.',
      'Pour in the dal and simmer 5 minutes.',
      'In a separate pan, lightly toast paneer cubes for 2 minutes.',
      'Serve dal over rice, top with paneer cubes and coriander.',
    ],
  },
  {
    name: 'Dinner',
    idea: 'Egg bhurji with 2 rotis and dahi',
    approx_protein_g: 30,
    approx_kcal: 500,
    prep_minutes: 15,
    ingredients: [
      '3 eggs',
      '1 chopped onion',
      '1 chopped tomato',
      '1 chopped green chilli (optional)',
      '½ tsp turmeric',
      '¼ tsp red chilli powder',
      '1 tsp oil',
      'Salt + coriander',
      '2 rotis',
      '1 small bowl (100g) plain curd',
    ],
    recipe: [
      'Beat the eggs with salt in a bowl.',
      'Heat oil in a pan, add onion, cook until soft.',
      'Add green chilli, tomato, turmeric, chilli powder. Cook 2 minutes.',
      'Pour in the beaten eggs and stir constantly for 3 minutes until dry.',
      'Garnish with coriander.',
      'Serve with warm rotis and a bowl of curd.',
    ],
  },
]

const NON_VEG_MEALS: Meal[] = [
  {
    name: 'Breakfast',
    idea: '3 boiled eggs + 2 toast + 1 banana',
    approx_protein_g: 24,
    approx_kcal: 450,
    prep_minutes: 12,
    ingredients: [
      '3 whole eggs',
      '2 slices whole-wheat bread',
      '1 medium banana',
      '½ tsp salt',
      '¼ tsp black pepper',
    ],
    recipe: [
      'Boil eggs — cold-start water, 8 minutes at a simmer.',
      'Peel eggs after 2 minutes in cold water.',
      'Toast the bread.',
      'Serve eggs sliced with salt + pepper, toast, and a banana on the side.',
    ],
  },
  {
    name: 'Lunch',
    idea: 'Chicken curry with rice + salad',
    approx_protein_g: 38,
    approx_kcal: 620,
    prep_minutes: 35,
    ingredients: [
      '150g boneless chicken breast, cubed',
      '¾ cup basmati rice',
      '1 chopped onion',
      '1 chopped tomato (or ½ cup puree)',
      '1 tsp ginger-garlic paste',
      '½ tsp turmeric',
      '1 tsp coriander powder',
      '½ tsp garam masala',
      '1 tbsp oil',
      'Salt + coriander',
      '1 cucumber + 1 tomato + lemon juice for salad',
    ],
    recipe: [
      'Cook rice in a pressure cooker: 1.5 cups water, 2 whistles.',
      'Heat oil in a pan, add onion, cook until golden.',
      'Add ginger-garlic paste, tomato, spices. Cook until oil separates.',
      'Add chicken, stir to coat, then add ½ cup water. Simmer 15 minutes covered.',
      'Sprinkle garam masala + coriander.',
      'Toss salad ingredients with lemon juice and salt.',
      'Serve curry over rice with the salad.',
    ],
  },
  {
    name: 'Dinner',
    idea: 'Grilled chicken with 2 rotis',
    approx_protein_g: 38,
    approx_kcal: 540,
    prep_minutes: 20,
    ingredients: [
      '150g boneless chicken breast',
      '2 tbsp curd',
      '1 tsp ginger-garlic paste',
      '½ tsp red chilli powder',
      '½ tsp turmeric',
      '½ tsp garam masala',
      '1 tsp lemon juice',
      'Salt to taste',
      '1 tsp oil',
      '2 whole-wheat rotis',
    ],
    recipe: [
      'Mix curd, ginger-garlic, spices, lemon, and salt. Rub over chicken.',
      'Marinate for 15 minutes.',
      'Heat a grill pan or non-stick pan with oil.',
      'Cook chicken 5-6 minutes per side until juices run clear.',
      'Let rest 2 minutes, slice, serve with hot rotis.',
    ],
  },
]

export function mealsFor(diet: DietPref): Meal[] {
  if (diet === 'veg') return VEG_MEALS
  if (diet === 'egg_veg') return EGG_VEG_MEALS
  return NON_VEG_MEALS
}

const PROTEIN_G_PER_KG: Record<Goal, number> = {
  muscle_gain: 1.7,
  strength: 1.7,
  fat_loss: 1.8,
  general_fitness: 1.4,
}

export function proteinTargetFor(goal: Goal, weight_kg: number): number {
  const multiplier = PROTEIN_G_PER_KG[goal] ?? 1.4
  const raw = weight_kg * multiplier
  const rounded = Math.round(raw / 5) * 5
  return Math.max(40, Math.min(220, rounded))
}

export function bmi(weight_kg: number, height_cm: number): number {
  if (!height_cm) return 0
  const h = height_cm / 100
  return Math.round((weight_kg / (h * h)) * 10) / 10
}
