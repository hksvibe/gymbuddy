import { useEffect, useState } from 'react'
import { Flame, Trophy, TrendingUp, Loader2, Plus, Scale, MoreHorizontal } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import IdentityStrip from '../components/IdentityStrip'
import MeasurementForm from '../components/MeasurementForm'
import TrendChart from '../components/TrendChart'
import { listCheckins, listPlans, listMeasurements, deleteMeasurement } from '../lib/storage'
import { useAuthUser } from '../hooks/useAuthUser'
import type { Checkin, Measurement, Plan } from '../lib/types'

interface WeekBar { week: number, count: number, planned: number }

export default function Progress() {
  const { user, loading: authLoading } = useAuthUser()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (authLoading) return
    (async () => {
      const [pl, ci, m] = await Promise.all([listPlans(), listCheckins(), listMeasurements()])
      setPlans(pl); setCheckins(ci); setMeasurements(m); setLoading(false)
    })()
  }, [authLoading, user?.uid])

  async function refreshMeasurements() {
    setMeasurements(await listMeasurements())
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    await deleteMeasurement(id)
    await refreshMeasurements()
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

  // ---- workout aggregates ----
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

  // ---- measurement aggregates ----
  const latest = measurements[0]
  const oldest = measurements[measurements.length - 1]
  const weightPoints = [...measurements]
    .reverse()
    .filter((m) => typeof m.weight_kg === 'number' && m.weight_kg! > 0)
    .map((m) => ({ date: m.logged_at, value: m.weight_kg as number }))

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
          <KpiCard icon={Flame} value={streak} label={streak === 1 ? 'week streak' : 'weeks streak'} tint="amber" />
          <KpiCard icon={Trophy} value={weeksCompleted} label="full weeks" tint="violet" />
          <KpiCard icon={TrendingUp} value={totalCheckins} label="check-ins" tint="success" />
        </div>

        {/* ---- Body tracker ---- */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">Body tracker</h2>
            {measurements.length > 0 && (
              <button onClick={() => setShowHistory((v) => !v)} className="text-xs text-violet-deep font-medium">
                {showHistory ? 'Hide history' : `${measurements.length} ${measurements.length === 1 ? 'entry' : 'entries'}`}
              </button>
            )}
          </div>

          <button
            onClick={() => setFormOpen(true)}
            className="w-full rounded-2xl bg-violet-deep text-white py-3.5 px-5 font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
            {measurements.length === 0 ? 'Log your first measurement' : 'Log today'}
          </button>

          {/* Latest snapshot */}
          {latest && (
            <div className="mt-4">
              <p className="text-xs text-ink-soft mb-2">
                Last logged {timeAgo(latest.logged_at)}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {typeof latest.weight_kg === 'number' && (
                  <MetricCard
                    label="Weight" value={latest.weight_kg} unit="kg" prominent
                    delta={deltaFrom(oldest?.weight_kg, latest.weight_kg)}
                  />
                )}
                {typeof latest.waist_cm === 'number' && (
                  <MetricCard
                    label="Waist" value={latest.waist_cm} unit="cm"
                    delta={deltaFrom(oldest?.waist_cm, latest.waist_cm)}
                  />
                )}
                {typeof latest.chest_cm === 'number' && (
                  <MetricCard
                    label="Chest" value={latest.chest_cm} unit="cm"
                    delta={deltaFrom(oldest?.chest_cm, latest.chest_cm)}
                  />
                )}
                {typeof latest.arms_cm === 'number' && (
                  <MetricCard
                    label="Arms" value={latest.arms_cm} unit="cm"
                    delta={deltaFrom(oldest?.arms_cm, latest.arms_cm)}
                  />
                )}
                {typeof latest.thighs_cm === 'number' && (
                  <MetricCard
                    label="Thighs" value={latest.thighs_cm} unit="cm"
                    delta={deltaFrom(oldest?.thighs_cm, latest.thighs_cm)}
                  />
                )}
                {typeof latest.hips_cm === 'number' && (
                  <MetricCard
                    label="Hips" value={latest.hips_cm} unit="cm"
                    delta={deltaFrom(oldest?.hips_cm, latest.hips_cm)}
                  />
                )}
                {typeof latest.body_fat_pct === 'number' && (
                  <MetricCard
                    label="Body fat" value={latest.body_fat_pct} unit="%"
                    delta={deltaFrom(oldest?.body_fat_pct, latest.body_fat_pct)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Weight trend */}
          {weightPoints.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Scale className="w-4 h-4 text-violet-deep" />
                <p className="text-sm font-semibold text-ink">Weight trend</p>
              </div>
              <TrendChart points={weightPoints} unit="kg" />
            </div>
          )}

          {/* History */}
          {showHistory && measurements.length > 0 && (
            <div className="mt-4 space-y-2">
              {measurements.map((m) => (
                <HistoryRow key={m.id} m={m} onDelete={() => onDelete(m.id)} />
              ))}
            </div>
          )}
        </section>

        {/* Bar chart */}
        <section className="mt-10">
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
                    <div className="absolute inset-x-0 bottom-0 rounded-t-lg bg-lavender-deep" style={{ height: `${ph}%` }} />
                    <div className="relative w-full rounded-t-lg bg-violet-deep transition-all" style={{ height: `${h}%`, minHeight: w.count > 0 ? '6px' : '0' }} />
                  </div>
                  <div className="text-xs text-ink-soft">W{w.week}</div>
                </div>
              )
            })}
          </div>
          {weekBars.length > 0 && (
            <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-violet-deep" /> Done</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-lavender-deep" /> Planned</span>
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

      <MeasurementForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => refreshMeasurements()}
        seedFromLatest={latest ?? null}
      />
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
      <p className="text-[10px] uppercase tracking-wider mt-1 font-semibold opacity-80">{label}</p>
    </div>
  )
}

function MetricCard({
  label, value, unit, prominent, delta,
}: {
  label: string, value: number, unit: string, prominent?: boolean,
  delta: { text: string; direction: 'down' | 'up' | 'flat' } | null,
}) {
  return (
    <div className={`rounded-2xl border-2 px-3 py-3 ${prominent ? 'border-violet-deep/30 bg-lavender' : 'border-gray-100 bg-white'}`}>
      <p className="text-[10px] text-ink-soft uppercase tracking-wider font-semibold">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${prominent ? 'text-violet-deep' : 'text-ink'}`}>
        {value}<span className="text-xs text-ink-soft font-medium"> {unit}</span>
      </p>
      {delta && (
        <p className={`text-[10px] font-medium mt-0.5 ${
          delta.direction === 'down' ? 'text-success-dark' :
          delta.direction === 'up' ? 'text-amber-700' : 'text-ink-soft'
        }`}>
          {delta.text}
        </p>
      )}
    </div>
  )
}

function HistoryRow({ m, onDelete }: { m: import('../lib/types').Measurement; onDelete: () => void }) {
  const parts: string[] = []
  if (typeof m.weight_kg === 'number') parts.push(`${m.weight_kg} kg`)
  if (typeof m.waist_cm === 'number') parts.push(`waist ${m.waist_cm}`)
  if (typeof m.chest_cm === 'number') parts.push(`chest ${m.chest_cm}`)
  if (typeof m.arms_cm === 'number') parts.push(`arms ${m.arms_cm}`)
  if (typeof m.thighs_cm === 'number') parts.push(`thighs ${m.thighs_cm}`)
  if (typeof m.hips_cm === 'number') parts.push(`hips ${m.hips_cm}`)
  if (typeof m.body_fat_pct === 'number') parts.push(`bf ${m.body_fat_pct}%`)
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{fmtDay(m.logged_at)}</p>
        <p className="text-xs text-ink-soft truncate">{parts.join(' · ') || 'no values'}</p>
        {m.notes && <p className="text-xs text-ink-soft italic mt-0.5 truncate">{m.notes}</p>}
      </div>
      <button onClick={onDelete} className="text-ink-soft p-1.5 hover:text-red-600" aria-label="Delete">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  )
}

function computeStreak(bars: WeekBar[]) {
  let streak = 0
  for (let i = bars.length - 1; i >= 0; i--) {
    if (bars[i].count > 0) streak++
    else break
  }
  return streak
}

function deltaFrom(from: number | undefined, to: number) {
  if (typeof from !== 'number' || from === to) {
    return from === to && typeof from === 'number' ? { text: 'no change', direction: 'flat' as const } : null
  }
  const diff = to - from
  const rounded = Math.abs(diff) < 1 ? diff.toFixed(1) : diff.toFixed(1)
  const direction: 'down' | 'up' = diff < 0 ? 'down' : 'up'
  const arrow = diff < 0 ? '↓' : '↑'
  return { text: `${arrow} ${Math.abs(Number(rounded))} since start`, direction }
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}
