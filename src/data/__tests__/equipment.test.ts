import { describe, it, expect } from 'vitest'
import { canonicalize } from '../equipment'

describe('canonicalize', () => {
  it('maps direct alias hits', () => {
    expect(canonicalize(['dumbbells'])).toEqual(['dumbbells'])
    expect(canonicalize(['kb'])).toEqual(['kettlebell'])
    expect(canonicalize(['barbell'])).toEqual(['barbell'])
  })

  it('handles case + whitespace', () => {
    expect(canonicalize(['  Dumbbells  '])).toEqual(['dumbbells'])
  })

  it('partial-matches multi-word aliases', () => {
    expect(canonicalize(['cable machine'])).toEqual(['cables'])
    expect(canonicalize(['leg press machine'])).toEqual(['leg_press'])
  })

  it('dedupes when multiple aliases collapse', () => {
    const out = canonicalize(['dumbbells', 'Dumbbell', 'DB'])
    expect(out).toEqual(['dumbbells'])
  })

  it('drops unknown items', () => {
    expect(canonicalize(['unicorn', 'dumbbells'])).toEqual(['dumbbells'])
  })

  it('extracts multiple equipments from a list', () => {
    const out = canonicalize(['dumbbells', 'bench', 'treadmill']).sort()
    expect(out).toEqual(['bench', 'dumbbells', 'treadmill'])
  })
})
