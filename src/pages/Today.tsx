import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Flame, Utensils, Loader2, Zap, Clock } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import ExerciseCard from '../components/ExerciseCard'
import Disclaimer from '../components/Disclaimer'
import YouTubeEmbed from '../components/YouTubeEmbed'
import FeltPrompt from '../components/FeltPrompt'
import {
  latestPlan, loadProfile, saveCheckin, checkinsForWeek, savePlan,
} from '../lib/storage'
import { generatePlan, profileToInput } from '../lib/api'
import { trimToFit } from '../data/exercises'
import type { Checkin, Exercise, Felt, Plan, UserProfile } from '../lib/types'

type ExerciseStatus = 'pending' | 'done' | 'skipped'

export default function Today() {
  const nav = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [weekCheckins, setWeekCheckins] = useState<Checkin[]>([])
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [statuses, setStatuses] = useState<Record<string, ExerciseStatus>>({})
  const [felt, setFelt] = useState<Felt | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [swapping, setSwapping] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expressMode, setExpressMode] = useState(false)
  const [videoFor, setVideoFor] = useState<Exercise | null>(null)

  useEffect(() => {
    (async () => {
      const p = await loadProfile()
      if (!p) { nav('/', { replace: true }); return }
      const pl = await latestPlan()
      if (!pl) { nav('/onboarding', { replace: true }); return }
      const ci = await checkinsForWeek(pl.week_number)
      setProfile(p); setPlan(pl); setWeekCheckins(ci)

      const doneDayLabels = new Set(ci.map((c) => c.day_label))
      const firstUndone = pl.plan_json.days.findIndex((d) => !doneDayLabels.has(d.day_label))
      setActiveDayIdx(firstUndone === -1 ? pl.plan_json.days.length - 1 : firstUndone)
      setLoading(false)
    })()
  }, [nav])

  const activeDay = plan?.plan_json.days[activeDayIdx]
  const alreadyCheckedIn = useMemo(
    () => !!activeDay && weekCheckins.some((c) => c.day_label === activeDay.day_label),
    [weekCheckins, activeDay],
  )

  // Express mode trims today's day to a 15-min budget (half the normal session).
  const displayedExercises: Exercise[] = useMemo(() => {
    if (!activeDay) return []
    if (!expressMode) return activeDay.exercises
    return trimToFit(activeDay.exercises, 15)
  }, [activeDay, expressMode])

  function setStatus(name: string, s: ExerciseStatus) {
    setStatuses((prev) => ({ ...prev, [name]: prev[name] === s ? 'pending' : s }))
  }

  async function handleCheckIn() {
    if (!plan || !activeDay) return
    setSaving(true)
    try {
      const exercises_done: string[] = []
      const exercises_skipped: string[] = []
      for (const ex of displayedExercises) {
        const s = statuses[ex.name]
        if (s === 'done') exercises_done.push(ex.name)
        else if (s === 'skipped') exercises_skipped.push(ex.name)
        else exercises_done.push(ex.name)
      }
      const saved = await saveCheckin({
        plan_id: plan.id,
        week_number: plan.week_number,
        day_label: activeDay.day_label,
        exercises_done,
        exercises_skipped,
        felt,
      })
      setWeekCheckins((cs) => [...cs, saved])
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function handleSwap(exerciseName: string) {
    if (!plan || !profile || !activeDay) return
    setSwapping(exerciseName)
    try {
      const fresh = await generatePlan(profileToInput(profile, plan.week_number, {
        completion_pct: 1, days_completed: 0,
        exercises_skipped: [exerciseName],
        felt_summary: { easy: 0, ok: 0, hard: 0, pain: 0 },
        equipment_changed: false,
      }))
      const sameDay = fresh.days[activeDayIdx] ?? fresh.days[0]
      const replacement = sameDay.exercises.find((e) => e.name !== exerciseName)
        ?? fresh.days.flatMap((d) => d.exercises).find((e) => e.name !== exerciseName)
      if (!replacement) return
      const newPlan = structuredClone(plan)
      const day = newPlan.plan_json.days[activeDayIdx]
      const idx = day.exercises.findIndex((e) => e.name === exerciseName)
      if (idx >= 0) day.exercises[idx] = replacement
      setPlan(newPlan)
      await savePlan({
        week_number: newPlan.week_number,
        equipment_snapshot: profile.equipment,
        plan_json: newPlan.plan_json,
        source: 'adaptive',
      })
    } finally {
      setSwapping(null)
    }
  }

  if (loading) {
    return (
      <MobileShell bottomBar={<BottomNav />}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-deep animate-spin" />
        </div>
      </MobileShell>
    )
  }
  if (!plan || !profile || !activeDay) return null

  return (
    <MobileShell bottomBar={<BottomNav />}>
      <div className="flex-1 pb-6">
        <header className="px-6 pt-8 pb-4">
          <p className="text-xs font-semibold text-violet-deep uppercase tracking-wider">
            Week {plan.week_number}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">
            {greeting()}, {profile.name.split(' ')[0]}.
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{plan.plan_json.summary}</p>
        </header>

        <Disclaimer />

        {/* Hero check-in button */}
        <div className="px-6 mt-6">
          <button
            onClick={handleCheckIn}
            disabled={alreadyCheckedIn || saving}
            className={`relative w-full rounded-3xl py-7 px-6 text-white text-xl font-extrabold shadow-lg transition active:scale-[0.98] ${
              alreadyCheckedIn
                ? 'bg-success/40 shadow-none cursor-not-allowed'
                : 'bg-success shadow-success/30 hover:bg-success-dark'
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {alreadyCheckedIn ? (
                <>
                  <Check className="w-6 h-6" strokeWidth={3.5} />
                  Checked in for {activeDay.day_label.split(' - ')[0]}
                </>
              ) : (
                <>
                  <Check className={`w-6 h-6 ${justSaved ? 'animate-pop-in' : ''}`} strokeWidth={3.5} />
                  I trained today
                </>
              )}
            </div>
            {!alreadyCheckedIn && (
              <p className="text-sm font-medium text-white/80 mt-1.5">
                Tap to log {activeDay.day_label}
              </p>
            )}
          </button>
          {justSaved && (
            <p className="mt-3 text-center text-sm text-success-dark font-medium animate-pop-in">
              Nice work. See you next session.
            </p>
          )}
          {!alreadyCheckedIn && (
            <div className="mt-4">
              <FeltPrompt value={felt} onChange={setFelt} />
            </div>
          )}
        </div>

        {/* Day tabs */}
        {plan.plan_json.days.length > 1 && (
          <div className="px-6 mt-6 -mb-2 flex gap-2 overflow-x-auto pb-2">
            {plan.plan_json.days.map((d, i) => {
              const checked = weekCheckins.some((c) => c.day_label === d.day_label)
              const active = i === activeDayIdx
              return (
                <button
                  key={d.day_label}
                  onClick={() => { setActiveDayIdx(i); setStatuses({}); setExpressMode(false) }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                    active
                      ? 'bg-violet-deep text-white border-violet-deep'
                      : checked
                      ? 'bg-success/10 text-success-dark border-success/30'
                      : 'bg-white text-ink-soft border-gray-200'
                  }`}
                >
                  {checked && '✓ '}
                  {d.day_label.split(' - ')[0]}
                </button>
              )
            })}
          </div>
        )}

        {/* Day section */}
        <section className="px-6 mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-ink">{activeDay.day_label}</h2>
            <span className="text-xs text-ink-soft flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {expressMode ? '~15 min' : `~${activeDay.est_minutes ?? profile.session_length} min`} · {activeDay.focus}
            </span>
          </div>

          {/* Express Workout toggle */}
          <button
            onClick={() => setExpressMode((v) => !v)}
            className={`mt-3 w-full rounded-2xl border-2 px-4 py-3 flex items-center gap-3 transition ${
              expressMode
                ? 'border-violet-deep bg-lavender text-violet-deep'
                : 'border-gray-100 bg-white text-ink hover:border-gray-200'
            }`}
          >
            <Zap className="w-5 h-5" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">
                {expressMode ? 'Express workout on' : 'Short on time?'}
              </p>
              <p className="text-xs text-ink-soft">
                {expressMode ? 'Trimmed to ~15 min — hit the essentials.' : 'Trim today\'s plan to ~15 min.'}
              </p>
            </div>
          </button>

          <div className="mt-3 space-y-3">
            {displayedExercises.map((ex) => (
              <div key={ex.name} className="relative">
                {swapping === ex.name && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <Loader2 className="w-5 h-5 text-violet-deep animate-spin" />
                  </div>
                )}
                <ExerciseCard
                  exercise={ex}
                  status={statuses[ex.name] ?? 'pending'}
                  onToggleDone={() => setStatus(ex.name, 'done')}
                  onToggleSkip={() => setStatus(ex.name, 'skipped')}
                  onWatchDemo={() => setVideoFor(ex)}
                  onSwap={() => handleSwap(ex.name)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Diet block */}
        <section className="px-6 mt-8">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-5 h-5 text-violet-deep" />
            <h2 className="text-lg font-bold text-ink">Eat for today</h2>
          </div>
          <div className="rounded-2xl bg-lavender border border-violet-deep/10 px-4 py-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-sm text-ink-soft">Aim for protein</p>
              <p className="text-xl font-bold text-violet-deep">
                {plan.plan_json.diet.daily_protein_target_g}g
              </p>
            </div>
            <div className="space-y-2">
              {plan.plan_json.diet.meals.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-semibold text-ink">{m.name}: </span>
                    <span className="text-ink-soft">{m.idea}</span>
                  </div>
                  <span className="text-xs text-ink-soft font-medium tabular-nums">
                    ~{m.approx_protein_g}g
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-soft italic">
              General guidance, not a medical diet plan.
            </p>
          </div>
        </section>

        {/* Safety note */}
        {plan.plan_json.safety_note && (
          <div className="px-6 mt-6">
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2">
              <Flame className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900 leading-relaxed">
                {plan.plan_json.safety_note}
              </p>
            </div>
          </div>
        )}
      </div>

      {videoFor && (
        <YouTubeEmbed
          open={!!videoFor}
          onClose={() => setVideoFor(null)}
          exerciseName={videoFor.name}
          searchQuery={videoFor.youtube_search_query}
          cachedVideoId={videoFor.video_id}
          planId={plan.id}
        />
      )}
    </MobileShell>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
