import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Flame, Utensils, Loader2, Zap, Clock, ChefHat, ShoppingBasket, Sunrise, Wind } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import ExerciseCard from '../components/ExerciseCard'
import Disclaimer from '../components/Disclaimer'
import YouTubeEmbed from '../components/YouTubeEmbed'
import FeltPrompt from '../components/FeltPrompt'
import RestTimer from '../components/RestTimer'
import FirstSessionNudge from '../components/FirstSessionNudge'
import SundayRecapBanner from '../components/SundayRecapBanner'
import { logEvent } from '../lib/analytics'
import {
  latestPlan, loadProfile, saveCheckin, checkinsForWeek, savePlan, listCheckins,
} from '../lib/storage'
import { generatePlan, isPlanStale, profileToInput } from '../lib/api'
import { trimToFit } from '../data/exercises'
// swap is intentionally removed — users get their adjustments via next week's regen
import { useAuthUser } from '../hooks/useAuthUser'
import type { Checkin, Exercise, Felt, Meal, Plan, UserProfile } from '../lib/types'

type ExerciseStatus = 'pending' | 'done' | 'skipped'

export default function Today() {
  const nav = useNavigate()
  const { loading: authLoading, user } = useAuthUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [weekCheckins, setWeekCheckins] = useState<Checkin[]>([])
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [statuses, setStatuses] = useState<Record<string, ExerciseStatus>>({})
  const [felt, setFelt] = useState<Felt | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [everCheckedIn, setEverCheckedIn] = useState(true)  // pessimistic — set false only after we've checked
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [expressMode, setExpressMode] = useState(false)
  const [videoFor, setVideoFor] = useState<Exercise | null>(null)
  const [timerFor, setTimerFor] = useState<Exercise | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { nav('/', { replace: true }); return }
    (async () => {
      const p = await loadProfile()
      if (!p) { nav('/onboarding', { replace: true }); return }
      let pl = await latestPlan()
      if (!pl) { nav('/onboarding', { replace: true }); return }
      const ci = await checkinsForWeek(pl.week_number)
      const allCi = await listCheckins()
      setEverCheckedIn(allCi.length > 0)

      // Auto-regenerate plans generated before warm-up/cool-down + recipe requirements shipped.
      if (isPlanStale(pl.plan_json)) {
        setRefreshing(true)
        setProfile(p); setPlan(pl); setWeekCheckins(ci); setLoading(false)
        try {
          const fresh = await generatePlan(profileToInput(p, pl.week_number))
          const newPlan = await savePlan({
            week_number: pl.week_number,
            equipment_snapshot: p.equipment,
            plan_json: fresh,
            source: 'initial',
          })
          pl = newPlan
          setPlan(newPlan)
        } catch (e) {
          console.warn('Plan refresh failed', e)
          setRefreshFailed(true)
        } finally {
          setRefreshing(false)
        }
      } else {
        setProfile(p); setPlan(pl); setWeekCheckins(ci); setLoading(false)
      }

      const doneDayLabels = new Set(ci.map((c) => c.day_label))
      const firstUndone = pl.plan_json.days.findIndex((d) => !doneDayLabels.has(d.day_label))
      setActiveDayIdx(firstUndone === -1 ? pl.plan_json.days.length - 1 : firstUndone)
    })()
  }, [authLoading, user?.uid, nav])

  const activeDay = plan?.plan_json.days[activeDayIdx]
  const alreadyCheckedIn = useMemo(
    () => !!activeDay && weekCheckins.some((c) => c.day_label === activeDay.day_label),
    [weekCheckins, activeDay],
  )

  // Split by phase — default to 'main' when the phase field is missing (older plans).
  const { warmup, main, cooldown } = useMemo(() => {
    if (!activeDay) return { warmup: [] as Exercise[], main: [] as Exercise[], cooldown: [] as Exercise[] }
    const groups = { warmup: [] as Exercise[], main: [] as Exercise[], cooldown: [] as Exercise[] }
    for (const ex of activeDay.exercises) {
      const phase = ex.phase ?? 'main'
      groups[phase].push(ex)
    }
    if (expressMode) groups.main = trimToFit(groups.main, 15, 4)
    return groups
  }, [activeDay, expressMode])

  function setStatus(name: string, s: ExerciseStatus) {
    setStatuses((prev) => ({ ...prev, [name]: prev[name] === s ? 'pending' : s }))
  }

  async function handleCheckIn() {
    if (!plan || !activeDay) return
    setSaving(true)
    setCheckInError(null)
    try {
      const exercises_done: string[] = []
      const exercises_skipped: string[] = []
      const allDisplayed = [...warmup, ...main, ...cooldown]
      for (const ex of allDisplayed) {
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
      // Analytics: first-check-in is a key leading indicator.
      if (!everCheckedIn) {
        logEvent('first_checkin', { week_number: plan.week_number })
        setEverCheckedIn(true)
      }
      logEvent('checkin', { week_number: plan.week_number, felt: felt ?? 'unset' })
      setTimeout(() => setJustSaved(false), 2500)
    } catch (e) {
      console.error('check-in failed', e)
      setCheckInError("Couldn't save your check-in. Try again?")
    } finally {
      setSaving(false)
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

        <FirstSessionNudge show={!everCheckedIn && plan.week_number === 1} />
        <SundayRecapBanner weekNumber={plan.week_number} hasCheckIns={weekCheckins.length > 0} />

        {refreshing && (
          <div className="mx-6 mt-3 rounded-2xl bg-violet-deep text-white px-4 py-3 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <p className="text-xs leading-snug">
              Updating your plan to the latest structure — warm-up + main + cool-down + recipes.
            </p>
          </div>
        )}
        {refreshFailed && !refreshing && (
          <div className="mx-6 mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs text-amber-900 leading-snug">
              Couldn&apos;t refresh your plan just now. Tap &quot;Generate next week&quot; from the Week tab to try again.
            </p>
          </div>
        )}

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
          {checkInError && (
            <p className="mt-3 text-center text-sm text-red-600 font-medium">
              {checkInError}
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
              {expressMode ? '~20 min' : `~${activeDay.est_minutes ?? profile.session_length} min`} · {activeDay.focus}
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
                {expressMode ? 'Main phase trimmed. Warm-up + cool-down still included.' : 'Trim the main phase (warm-up + cool-down stay).'}
              </p>
            </div>
          </button>

          {/* Phase groups */}
          {warmup.length > 0 && (
            <PhaseGroup
              title="Warm-up (dynamic)" subtitle="Loosen up before the real work."
              icon={<Sunrise className="w-4 h-4" />}
              tint="amber"
              exercises={warmup}
              statuses={statuses} setStatus={setStatus}
              onWatchDemo={(ex) => setVideoFor(ex)}
              onStartTimer={(ex) => setTimerFor(ex)}
            />
          )}

          <PhaseGroup
            title="Main workout" subtitle={`${main.length} exercises`}
            tint="violet"
            exercises={main}
            statuses={statuses} setStatus={setStatus}
            onWatchDemo={(ex) => setVideoFor(ex)}
            onStartTimer={(ex) => setTimerFor(ex)}
          />

          {cooldown.length > 0 && (
            <PhaseGroup
              title="Cool-down (static stretch)" subtitle="Slow the breath. Hold each stretch."
              icon={<Wind className="w-4 h-4" />}
              tint="success"
              exercises={cooldown}
              statuses={statuses} setStatus={setStatus}
              onWatchDemo={(ex) => setVideoFor(ex)}
              onStartTimer={(ex) => setTimerFor(ex)}
            />
          )}
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
            <div className="space-y-2.5">
              {plan.plan_json.diet.meals.map((m) => (
                <MealRow key={m.name} meal={m} />
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
      {timerFor && (
        <RestTimer open={!!timerFor} onClose={() => setTimerFor(null)} exercise={timerFor} />
      )}
    </MobileShell>
  )
}

interface PhaseGroupProps {
  title: string
  subtitle: string
  icon?: React.ReactNode
  tint: 'amber' | 'violet' | 'success'
  exercises: Exercise[]
  statuses: Record<string, ExerciseStatus>
  setStatus: (name: string, s: ExerciseStatus) => void
  onWatchDemo: (ex: Exercise) => void
  onStartTimer: (ex: Exercise) => void
}

function PhaseGroup({
  title, subtitle, icon, tint, exercises, statuses, setStatus, onWatchDemo, onStartTimer,
}: PhaseGroupProps) {
  const styles = {
    amber: 'text-amber-700',
    violet: 'text-violet-deep',
    success: 'text-success-dark',
  }[tint]
  if (exercises.length === 0) return null
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className={styles}>{icon}</span>}
        <h3 className={`text-sm font-bold ${styles} uppercase tracking-wider`}>{title}</h3>
      </div>
      <p className="text-xs text-ink-soft mb-3">{subtitle}</p>
      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.name}
            exercise={ex}
            status={statuses[ex.name] ?? 'pending'}
            onToggleDone={() => setStatus(ex.name, 'done')}
            onToggleSkip={() => setStatus(ex.name, 'skipped')}
            onWatchDemo={() => onWatchDemo(ex)}
            onStartTimer={() => onStartTimer(ex)}
          />
        ))}
      </div>
    </div>
  )
}

function MealRow({ meal }: { meal: Meal }) {
  return (
    <details className="group rounded-xl bg-white/60 border border-white/60 hover:border-violet-deep/20 transition">
      <summary className="list-none cursor-pointer px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <span className="font-semibold text-ink">{meal.name}: </span>
            <span className="text-ink-soft">{meal.idea}</span>
          </p>
          {(meal.prep_minutes || meal.approx_kcal) && (
            <p className="text-[10px] text-ink-soft mt-0.5">
              {meal.prep_minutes && `${meal.prep_minutes} min`}
              {meal.prep_minutes && meal.approx_kcal && ' · '}
              {meal.approx_kcal && `~${meal.approx_kcal} kcal`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-ink-soft font-medium tabular-nums">
            ~{meal.approx_protein_g}g
          </span>
          <span className="text-ink-soft text-xs group-open:rotate-180 transition">▾</span>
        </div>
      </summary>
      {(meal.ingredients?.length || meal.recipe?.length) && (
        <div className="px-3 pb-3 space-y-3 border-t border-violet-deep/10 pt-3">
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-violet-deep uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <ShoppingBasket className="w-3 h-3" /> Ingredients
              </p>
              <ul className="space-y-0.5">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="text-xs text-ink flex items-start gap-1.5">
                    <span className="text-violet-deep mt-1">•</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meal.recipe && meal.recipe.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-violet-deep uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <ChefHat className="w-3 h-3" /> Recipe
              </p>
              <ol className="space-y-1">
                {meal.recipe.map((step, i) => (
                  <li key={i} className="text-xs text-ink flex items-start gap-2">
                    <span className="text-violet-deep font-semibold flex-shrink-0">{i + 1}.</span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </details>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
