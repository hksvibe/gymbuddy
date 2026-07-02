// Minimal SVG line chart for a single metric's trend over time.
// No external chart lib; renders as-is at mobile widths.

interface Point { date: string; value: number }
interface Props {
  points: Point[]      // ordered oldest → newest
  unit: string
  color?: string       // stroke colour (Tailwind hex)
  height?: number
  emptyLabel?: string
}

export default function TrendChart({
  points, unit, color = '#5B21B6', height = 140, emptyLabel = 'Log a measurement to see the trend.',
}: Props) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white h-32 flex items-center justify-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    )
  }

  if (points.length === 1) {
    const only = points[0]
    return (
      <div className="rounded-2xl border border-gray-100 bg-white h-32 flex flex-col items-center justify-center gap-1">
        <p className="text-2xl font-bold text-ink tabular-nums">{only.value} {unit}</p>
        <p className="text-xs text-ink-soft">on {fmtDate(only.date)} — one entry so far</p>
      </div>
    )
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(0.5, max - min)  // avoid divide-by-zero on flat lines

  // Chart geometry
  const W = 340
  const H = height
  const padX = 8
  const padY = 20

  const x = (i: number) => padX + (i * (W - padX * 2)) / (points.length - 1)
  const y = (v: number) => padY + ((max - v) / range) * (H - padY * 2)

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ')
  const areaPath = `${linePath} L ${x(points.length - 1)} ${H - padY} L ${x(0)} ${H - padY} Z`

  const first = points[0]
  const last = points[points.length - 1]
  const delta = last.value - first.value
  const deltaLabel = delta === 0 ? 'no change' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${unit}`

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-3 pt-3 pb-2">
      <div className="flex items-baseline justify-between mb-1 px-1">
        <p className="text-xs text-ink-soft">{points.length} entries</p>
        <p className="text-xs font-medium" style={{ color: delta > 0 ? '#B45309' : delta < 0 ? '#15803D' : '#6B6375' }}>
          {deltaLabel}
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#tc-fill)" />
        <path d={linePath} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 4 : 2.5} fill={color} />
        ))}
      </svg>
      <div className="flex items-baseline justify-between mt-1 px-1 text-[10px] text-ink-soft">
        <span>{fmtDate(first.date)}</span>
        <span>{fmtDate(last.date)}</span>
      </div>
    </div>
  )
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
