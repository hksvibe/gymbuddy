import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Check, Loader2, Calendar } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import PrimaryButton from '../components/PrimaryButton'
import {
  latestPlan, loadProfile, checkinsForWeek, savePlan, saveWeeklyReview,
} from '../lib/storage'
import { generatePlan, profileToInput } from '../lib/api'
import { buildLastWeekSummary } from '../lib/adaptive'
import { useAuthUser } from '../hooks/useAuthUser'
import type { Checkin, Plan, UserProfile } from '../lib/types'

export default function WeeklyReview() {
  const nav = useNavigate()
  const { loading: authLoading, user } = useAuthUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { nav('/', { replace: true }); return }
    (async () => {
      const [p, pl] = await Promise.all([loadProfile(), latestPlan()])
      if (!p) { nav('/onboarding', { replace: true }); return }
      if (!pl) { nav('/onboarding', { replace: true }); return }
      const ci = await checkinsForWeek(pl.week_number)
      setProfile(p); setPlan(pl); setCheckins(ci)
      setLoading(false)
    })()
  }, [authLoading, user?.uid, nav])

  if (loading || !plan || !profile) {
    return (
      <MobileShell bottomBar={<BottomNav />}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-deep animate-spin" />
        </div>
      </MobileShell>
    )
  }

  const days_planned = plan.plan_json.days.length
  const days_completed = new Set(checkins.map((c) => c.day_label)).size
  const completion_pct = days_planned > 0 ? days_completed / days_planned : 0
  const lastWeek = buildLastWeekSummary({
    checkins,
    days_planned,
    previous_equipment: plan.equipment_snapshot,
    current_equipment: profile.equipment,
  })
  const exercises_done_count = checkins.reduce((sum, c) => sum + c.exercises_done.length, 0)
  const exercises_skipped_count = checkins.reduce((sum, c) => sum + c.exercises_skipped.length, 0)

  const summary = encouragingSummary(lastWeek, days_planned)

  async function generateNext() {
    if (!profile || !plan) return
    setGenerating(true)
    try {
      await saveWeeklyReview({
        week_number: plan.week_number,
        days_planned, days_completed, completion_pct,
        summary_text: summary,
      })
      const nextJson = await generatePlan(profileToInput(profile, plan.week_number + 1, lastWeek))
      await savePlan({
        week_number: plan.week_number + 1,
        equipment_snapshot: profile.equipment,
        plan_json: nextJson,
        source: 'adaptive',
      })
      nav('/today', { replace: true })
    } finally {
      setGenerating(false)
    }
  }

  const completionPercent = Math.round(completion_pct * 100)

  return (
    <MobileShell bottomBar={<BottomNav />}>
      <div className="flex-1 px-6 pt-8 pb-6">
        <p className="text-xs font-semibold text-violet-deep uppercase tracking-wider">
          Week {plan.week_number} review
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Your week.</h1>

        <div className="mt-6 rounded-3xl bg-gradient-to-br from-violet-deep to-violet-bright p-6 text-white shadow-lg shadow-violet-deep/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/70 uppercase tracking-wider">Completion</p>
              <p className="text-5xl font-extrabold mt-1">{completionPercent}%</p>
              <p className="text-sm text-white/80 mt-2">
                {days_completed} of {days_planned} sessions
              </p>
            </div>
            <CompletionRing pct={completion_pct} />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-violet-deep/15 bg-lavender px-4 py-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-violet-deep mt-0.5 flex-shrink-0" />
          <p className="text-sm text-ink leading-relaxed">{summary}</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard label="Exercises done" value={exercises_done_count} accent="success" />
          <StatCard label="Exercises skipped" value={exercises_skipped_count} accent="ink" />
        </div>

        {/* Felt summary */}
        {(lastWeek.felt_summary.easy + lastWeek.felt_summary.ok + lastWeek.felt_summary.hard + lastWeek.felt_summary.pain) > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink mb-2">How sessions felt</h3>
            <div className="flex flex-wrap gap-1.5">
              {lastWeek.felt_summary.easy > 0 && <FeltChip emoji="💪" count={lastWeek.felt_summary.easy} label="easy" tint="success" />}
              {lastWeek.felt_summary.ok > 0 && <FeltChip emoji="👍" count={lastWeek.felt_summary.ok} label="ok" tint="violet" />}
              {lastWeek.felt_summary.hard > 0 && <FeltChip emoji="😅" count={lastWeek.felt_summary.hard} label="hard" tint="amber" />}
              {lastWeek.felt_summary.pain > 0 && <FeltChip emoji="🚨" count={lastWeek.felt_summary.pain} label="pain" tint="red" />}
            </div>
          </div>
        )}

        {lastWeek.exercises_skipped.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-ink mb-2">We&apos;ll swap these next week</h3>
            <div className="flex flex-wrap gap-1.5">
              {lastWeek.exercises_skipped.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-ink-soft rounded-full px-3 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {lastWeek.equipment_changed && (
          <div className="mt-5 rounded-2xl border border-violet-deep/15 bg-lavender/60 px-4 py-3 text-sm text-violet-deep">
            🔧 Your equipment changed — next week will be rebuilt around your updated list.
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-ink mb-2">Your week</h3>
          <div className="space-y-2">
            {plan.plan_json.days.map((d) => {
              const c = checkins.find((x) => x.day_label === d.day_label)
              return (
                <div
                  key={d.day_label}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    c ? 'bg-success text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {c ? <Check className="w-4 h-4" strokeWidth={3} /> : <Calendar className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{d.day_label}</p>
                    {c && (
                      <p className="text-xs text-ink-soft">
                        {c.exercises_done.length} done · {c.exercises_skipped.length} skipped{c.felt && ` · felt ${c.felt}`}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-8">
          <PrimaryButton onClick={generateNext} loading={generating}>
            <span className="inline-flex items-center justify-center gap-2">
              Generate Week {plan.week_number + 1}
              <ArrowRight className="w-5 h-5" />
            </span>
          </PrimaryButton>
        </div>
      </div>
    </MobileShell>
  )
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 36
  const c = 2 * Math.PI * r
  const dash = c * Math.max(0, Math.min(1, pct))
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
      <circle cx="46" cy="46" r={r} stroke="rgba(255,255,255,0.25)" strokeWidth="8" fill="none" />
      <circle
        cx="46" cy="46" r={r}
        stroke="white" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
      />
    </svg>
  )
}

function StatCard({ label, value, accent }: { label: string, value: number, accent: 'success' | 'ink' }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent === 'success' ? 'text-success-dark' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}

function FeltChip({ emoji, count, label, tint }: { emoji: string, count: number, label: string, tint: 'success' | 'violet' | 'amber' | 'red' }) {
  const styles = {
    success: 'bg-success/10 text-success-dark',
    violet:  'bg-lavender text-violet-deep',
    amber:   'bg-amber-50 text-amber-800',
    red:     'bg-red-50 text-red-700',
  }[tint]
  return (
    <span className={`text-xs rounded-full px-3 py-1 ${styles}`}>
      {emoji} {count} {label}
    </span>
  )
}

function encouragingSummary(lw: { completion_pct: number; felt_summary: { hard: number; pain: number; easy: number; ok: number }; equipment_changed: boolean }, planned: number) {
  if (planned === 0) return 'Hit your first session and we\'ll start tracking your week.'
  const done = Math.round(lw.completion_pct * planned)
  if (lw.felt_summary.pain > 0) return `You flagged pain in ${lw.felt_summary.pain} session${lw.felt_summary.pain > 1 ? 's' : ''}. We'll swap that pattern next week. Check with a doctor if it persists.`
  if (done === 0) return "No sessions yet — no judgment. One workout this week resets everything."
  if (lw.completion_pct >= 0.85) return `${done} of ${planned} sessions done — you crushed it. Small progression coming next week.`
  if (lw.completion_pct >= 0.6) return `${done} of ${planned} sessions in — solid. We'll swap the exercises you skipped.`
  return `Partial wins still count. We'll simplify next week to make it easier to show up.`
}
