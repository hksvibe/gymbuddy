import { describe, it, expect } from 'vitest'
import { estimateMinutes, pickExercises, trimToFit } from '../exercises'
import type { Exercise } from '../../lib/types'

describe('pickExercises — equipment + injury filter', () => {
  it('returns bodyweight push when only bodyweight available', () => {
    const out = pickExercises(['push'], ['bodyweight'], [], [])
    expect(out.length).toBeGreaterThan(0)
    expect(out[0].uses_equipment).toContain('bodyweight')
  })

  it('skips Romanian deadlift when lower_back is in injuries', () => {
    const out = pickExercises(['hinge'], ['dumbbells', 'bench'], ['lower_back'], [])
    expect(out.find((e) => e.name.toLowerCase().includes('romanian'))).toBeUndefined()
  })

  it('skips shoulder press when shoulder in injuries', () => {
    const out = pickExercises(['overhead'], ['dumbbells'], ['shoulder'], [])
    expect(out.find((e) => e.name.toLowerCase().includes('shoulder press'))).toBeUndefined()
  })

  it('skips overhead press for high_bp', () => {
    const out = pickExercises(['overhead'], ['dumbbells'], [], ['high_bp'])
    expect(out.find((e) => e.name.toLowerCase().includes('shoulder press'))).toBeUndefined()
  })
})

describe('trimToFit', () => {
  it('returns original list when already under budget', () => {
    const exercises: Exercise[] = [
      { name: 'Plank', sets: 3, reps: '20 sec', rpe: '6', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['bodyweight'], safe_for_user: true, phase: 'main' as const },
    ]
    const out = trimToFit(exercises, 30)
    expect(out.length).toBe(exercises.length)
  })

  it('keeps at least 2 exercises even under tight budget', () => {
    const exercises: Exercise[] = [
      { name: 'Plank', sets: 3, reps: '20 sec', rpe: '6', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['bodyweight'], safe_for_user: true, phase: 'main' as const },
      { name: 'Dumbbell Goblet Squat', sets: 3, reps: '10-12', rpe: '6-7', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['dumbbells'], safe_for_user: true, phase: 'main' as const },
      { name: 'Dumbbell One-Arm Row', sets: 3, reps: '10-12', rpe: '6-7', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['dumbbells'], safe_for_user: true, phase: 'main' as const },
    ]
    const out = trimToFit(exercises, 5)
    expect(out.length).toBeGreaterThanOrEqual(2)
  })

  it('drops trailing accessories first', () => {
    const exercises: Exercise[] = [
      { name: 'Dumbbell Goblet Squat', sets: 3, reps: '10-12', rpe: '6-7', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['dumbbells'], safe_for_user: true, phase: 'main' as const },
      { name: 'Dumbbell Bench Press', sets: 3, reps: '8-10', rpe: '6-7', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['dumbbells'], safe_for_user: true, phase: 'main' as const },
      { name: 'Plank', sets: 3, reps: '20 sec', rpe: '6', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['bodyweight'], safe_for_user: true, phase: 'main' as const },
    ]
    const out = trimToFit(exercises, 14)
    expect(out[0].name).toBe('Dumbbell Goblet Squat')
  })
})

describe('estimateMinutes', () => {
  it('sums approx minutes per known exercise', () => {
    const exercises: Exercise[] = [
      { name: 'Plank', sets: 3, reps: '20 sec', rpe: '6', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['bodyweight'], safe_for_user: true, phase: 'main' as const },
      { name: 'Dumbbell Goblet Squat', sets: 3, reps: '10-12', rpe: '6-7', why: '', form_cue: '', youtube_search_query: '', video_id: null, uses_equipment: ['dumbbells'], safe_for_user: true, phase: 'main' as const },
    ]
    expect(estimateMinutes(exercises)).toBeGreaterThan(0)
  })
})
