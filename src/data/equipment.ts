// Canonical equipment vocabulary + helpers for the photo-detect → confirm UI.

import type { Equipment } from '../lib/types'

interface CatalogEntry {
  id: Equipment
  label: string
  emoji: string
  // Aliases used to canonicalize free-form vision-LLM responses.
  aliases: string[]
}

export const EQUIPMENT_CATALOG: CatalogEntry[] = [
  { id: 'bodyweight', label: 'Bodyweight only', emoji: '🤸', aliases: ['bodyweight', 'no equipment', 'none'] },
  { id: 'dumbbells', label: 'Dumbbells', emoji: '🏋️', aliases: ['dumbbell', 'dumbbells', 'db', 'free weights'] },
  { id: 'barbell', label: 'Barbell', emoji: '🏋️‍♂️', aliases: ['barbell', 'bar', 'olympic bar', 'ez curl bar'] },
  { id: 'bench', label: 'Bench', emoji: '🪑', aliases: ['bench', 'flat bench', 'adjustable bench', 'incline bench'] },
  { id: 'machines', label: 'Machines (general)', emoji: '⚙️', aliases: ['machine', 'machines', 'gym machine'] },
  { id: 'lat_pulldown', label: 'Lat pulldown', emoji: '⬇️', aliases: ['lat pulldown', 'lat pull down', 'pulldown'] },
  { id: 'leg_press', label: 'Leg press', emoji: '🦵', aliases: ['leg press', 'leg press machine'] },
  { id: 'chest_press_machine', label: 'Chest press machine', emoji: '💪', aliases: ['chest press', 'chest press machine', 'pec deck'] },
  { id: 'cables', label: 'Cable machine', emoji: '🔗', aliases: ['cable', 'cables', 'cable machine', 'cable tower'] },
  { id: 'kettlebell', label: 'Kettlebells', emoji: '🔔', aliases: ['kettlebell', 'kettlebells', 'kb'] },
  { id: 'resistance_bands', label: 'Resistance bands', emoji: '🎗️', aliases: ['band', 'bands', 'resistance band', 'resistance bands'] },
  { id: 'treadmill', label: 'Treadmill / cardio', emoji: '🏃', aliases: ['treadmill', 'cardio machine', 'elliptical', 'bike', 'rower'] },
  { id: 'pull_up_bar', label: 'Pull-up bar', emoji: '🆙', aliases: ['pull up bar', 'pull-up bar', 'chin up bar'] },
]

const ALL_ALIASES = (() => {
  const m = new Map<string, Equipment>()
  for (const e of EQUIPMENT_CATALOG) {
    for (const a of e.aliases) m.set(a.toLowerCase(), e.id)
  }
  return m
})()

export function canonicalize(detected: string[]): Equipment[] {
  const out = new Set<Equipment>()
  for (const raw of detected) {
    const key = raw.trim().toLowerCase()
    const direct = ALL_ALIASES.get(key)
    if (direct) { out.add(direct); continue }
    // partial-match scan
    for (const [alias, id] of ALL_ALIASES.entries()) {
      if (key.includes(alias) || alias.includes(key)) { out.add(id); break }
    }
  }
  return Array.from(out)
}

export function labelFor(id: Equipment): string {
  return EQUIPMENT_CATALOG.find((e) => e.id === id)?.label ?? id
}

export function emojiFor(id: Equipment): string {
  return EQUIPMENT_CATALOG.find((e) => e.id === id)?.emoji ?? '⚙️'
}
