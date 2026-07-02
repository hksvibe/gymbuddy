import { useEffect, useState } from 'react'
import { Flame, Trophy, TrendingUp, Loader2 } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import IdentityStrip from '../components/IdentityStrip'
import { listCheckins, listPlans } from '../lib/storage'
import type { Checkin, Plan } from '../lib/types'

interface WeekBar { week: number, count: number, planned: number }

export default function Progress() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])

  useEffect(() => {
    (async () => {
      const [pl, ci] = await Promise.all([listPlans(), listCheckins()])
      setPlans(pl); setCheckins(ci); setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <MobileShell bottomBar={<BottomNav />}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-deep animate-spin" />
        </div>
      </MobileShell>
    )
  }

  // Aggregate per-week
  const weeks = new Map<number, WeekBar>()
  for (const p of plans) {
    if (!weeks.has(p.week_number)) {
      weeks.set(p.week_number, { week: p.week_number, count: 0, planned: p.plan_json.days.length })
    }
  }
  for (const c of checkins) {
    const w = weeks.get(c.week_number)
    if (w) w.count = Math.max(w.count, new Set(checkins.filter((x) => x.week_number === c.week_number).map((x) => x.day_label)).size)
  }
  const weekBars: WeekBar[] = Array.from(weeks.values()).sort((a, b) => a.week - b.week)
  const totalCheckins = checkins.length
  const weeksWithCheckins = new Set(checkins.map((c) => c.week_number)).size
  const streak = computeStreak(weekBars)
  const weeksCompleted = weekBars.filter((w) => w.planned > 0 && w.count >= w.planned).length

  const maxBar = Math.max(1, ...weekBars.map((w) => Math.max(w.count, w.planned)))

  return (
    <MobileShell bottomBar={<BottomNav />}>
      <div className="flex-1 px-6 pt-8 pb-6">
        <p className="text-xs font-semibold text-violet-deep uppercase tracking-wider">
          Your progress
        </p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Showing up adds up.</h1>

        <div className="mt-5">
          <IdentityStrip />
        </div>

        {/* KPI cards */}
        <div className="mt-6 grid grid-cols-3 gap-2.5">
          <KpiCard
            icon={Flame}
            value={streak}
            label={streak === 1 ? 'week streak' : 'weeks streak'}
            tint="amber"
          />
          <KpiCard
            icon={Trophy}
            value={weeksCompleted}
            label="full weeks"
            tint="violet"
          />
          <KpiCard
            icon={TrendingUp}
            value={totalCheckins}
            label="check-ins"
            tint="success"
          />
        </div>

        {/* Bar chart */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-ink">Check-ins per week</h2>
          <p className="mt-1 text-sm text-ink-soft">
            {weeksWithCheckins === 0 ? "Tap into the gym once and this fills up." : `${weeksWithCheckins} ${weeksWithCheckins === 1 ? 'week' : 'weeks'} of training so far.`}
          </p>

          <div className="mt-6 flex items-end gap-2 h-44 px-1">
            {weekBars.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-300">
                No data yet
              </div>
            )}
            {weekBars.map((w) => {
              const h = (w.count / maxBar) * 100
              const ph = (w.planned / maxBar) * 100
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="text-xs font-bold text-ink">{w.count}</div>
                  <div className="relative w-full flex-1 flex items-end">
                    {/* planned guide bar */}
                    <div
                      className="absolute inset-x-0 bottom-0 rounded-t-lg bg-lavender-deep"
                      style={{ height: `${ph}%` }}
                    />
                    {/* actual bar */}
                    <div
                      className="relative w-full rounded-t-lg bg-violet-deep transition-all"
                      style={{ height: `${h}%`, minHeight: w.count > 0 ? '6px' : '0' }}
                    />
                  </div>
                  <div className="text-xs text-ink-soft">W{w.week}</div>
                </div>
              )
            })}
          </div>
          {weekBars.length > 0 && (
            <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-violet-deep" /> Done
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-lavender-deep" /> Planned
              </span>
            </div>
          )}
        </section>

        {/* Motivational footer */}
        <div className="mt-8 rounded-2xl bg-lavender border border-violet-deep/10 px-4 py-4 text-center">
          <p className="text-sm text-ink-soft leading-relaxed">
            {streak >= 3
              ? `🔥 ${streak} weeks in a row. The hard part is over.`
              : streak >= 1
              ? "One down, more to go. Keep the streak alive."
              : "First check-in lights this whole screen up."}
          </p>
        </div>
      </div>
    </MobileShell>
  )
}

function KpiCard({
  icon: Icon, value, label, tint,
}: {
  icon: typeof Flame, value: number, label: string,
  tint: 'amber' | 'violet' | 'success',
}) {
  const styles = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    violet: 'bg-lavender border-violet-deep/20 text-violet-deep',
    success: 'bg-success/10 border-success/20 text-success-dark',
  }[tint]
  return (
    <div className={`rounded-2xl border-2 px-3 py-3.5 ${styles}`}>
      <Icon className="w-4 h-4" />
      <p className="mt-1.5 text-2xl font-extrabold leading-none tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider mt-1 font-semibold opacity-80">
        {label}
      </p>
    </div>
  )
}

function computeStreak(bars: WeekBar[]) {
  // streak = consecutive most-recent weeks where at least 1 check-in happened
  let streak = 0
  for (let i = bars.length - 1; i >= 0; i--) {
    if (bars[i].count > 0) streak++
    else break
  }
  return streak
}
