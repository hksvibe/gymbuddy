import { useEffect, useRef, useState } from 'react'
import { X, Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import type { Exercise } from '../lib/types'

interface Props {
  open: boolean
  onClose: () => void
  exercise: Exercise
}

// Countdown timer for rest between sets (or hold duration for planks/stretches).
// Simple, offline-first — no wake lock or audio libraries pulled in.
export default function RestTimer({ open, onClose, exercise }: Props) {
  const isHold = typeof exercise.hold_seconds === 'number' && exercise.hold_seconds > 0
  const totalSets = Math.max(1, exercise.sets || 1)
  const restSeconds = exercise.rest_seconds ?? (isHold ? 30 : 45)
  const holdSeconds = exercise.hold_seconds ?? 30

  const [phase, setPhase] = useState<'work' | 'rest'>(isHold ? 'work' : 'rest')
  const [setIndex, setSetIndex] = useState(1)
  const [remaining, setRemaining] = useState(isHold ? holdSeconds : restSeconds)
  const [running, setRunning] = useState(true)
  const tickRef = useRef<number | null>(null)

  // Reset when opened for a new exercise
  useEffect(() => {
    if (!open) return
    setPhase(isHold ? 'work' : 'rest')
    setSetIndex(1)
    setRemaining(isHold ? holdSeconds : restSeconds)
    setRunning(true)
  }, [open, exercise.name, isHold, restSeconds, holdSeconds])

  useEffect(() => {
    if (!open || !running) return
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1))
    }, 1000)
    return () => { if (tickRef.current) window.clearInterval(tickRef.current) }
  }, [open, running])

  // Advance when we hit 0
  useEffect(() => {
    if (remaining !== 0 || !running) return
    beep()
    if (setIndex >= totalSets && phase === (isHold ? 'work' : 'rest')) {
      // All sets done — auto-stop.
      setRunning(false)
      return
    }
    if (isHold) {
      if (phase === 'work') {
        setPhase('rest'); setRemaining(restSeconds)
      } else {
        setPhase('work'); setSetIndex((i) => i + 1); setRemaining(holdSeconds)
      }
    } else {
      setSetIndex((i) => i + 1)
      setRemaining(restSeconds)
    }
  }, [remaining, running, setIndex, totalSets, phase, isHold, restSeconds, holdSeconds])

  if (!open) return null

  const totalForPhase = phase === 'work' ? holdSeconds : restSeconds
  const pct = totalForPhase > 0 ? (remaining / totalForPhase) : 0
  const bigLabel = phase === 'work' ? 'HOLD' : 'REST'
  const setsLabel = `Set ${Math.min(setIndex, totalSets)} of ${totalSets}`
  const finished = remaining === 0 && !running

  function addTime(delta: number) {
    setRemaining((r) => Math.max(0, r + delta))
    if (delta > 0) setRunning(true)
  }
  function skip() {
    setRemaining(0)
  }
  function reset() {
    setPhase(isHold ? 'work' : 'rest')
    setSetIndex(1)
    setRemaining(isHold ? holdSeconds : restSeconds)
    setRunning(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink text-white flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex-1 truncate">
          <p className="text-[10px] text-white/60 uppercase tracking-wider">Timer</p>
          <p className="text-sm font-semibold truncate">{exercise.name}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-white/10" aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.15)" strokeWidth="6" fill="none" />
            <circle
              cx="50" cy="50" r="45"
              stroke={phase === 'work' ? '#16A34A' : '#7C3AED'}
              strokeWidth="6" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${pct * 283} 283`}
              className="transition-all duration-1000 linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-xs text-white/60 uppercase tracking-widest">{bigLabel}</p>
            <p className="text-6xl font-extrabold tabular-nums mt-1">
              {formatMS(remaining)}
            </p>
            <p className="text-sm text-white/60 mt-1">{setsLabel}</p>
          </div>
        </div>

        {finished && (
          <p className="mt-6 text-lg font-semibold text-success animate-pop-in">
            All sets complete. Nice work.
          </p>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button onClick={() => addTime(-15)} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
            −15s
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="rounded-full bg-white text-ink w-16 h-16 flex items-center justify-center shadow-lg active:scale-95"
            aria-label={running ? 'Pause' : 'Play'}
          >
            {running ? <Pause className="w-7 h-7" strokeWidth={2.5} /> : <Play className="w-7 h-7 fill-current ml-1" />}
          </button>
          <button onClick={() => addTime(15)} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">
            +15s
          </button>
        </div>

        <div className="mt-4 flex items-center gap-6">
          <button onClick={reset} className="text-sm text-white/70 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button onClick={skip} className="text-sm text-white/70 flex items-center gap-1.5">
            <SkipForward className="w-4 h-4" /> Skip
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-xs text-white/50">
          Take a breath. Sip water. Keep it beginner-safe.
        </p>
      </div>
    </div>
  )
}

function formatMS(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Short audible + vibration cue at phase change. Silent if the browser doesn't allow it.
function beep() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    const ctx = new AC()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.frequency.value = 660; g.gain.value = 0.06
    o.start(); o.stop(ctx.currentTime + 0.25)
    setTimeout(() => ctx.close(), 400)
  } catch { /* ignore */ }
  try {
    if (navigator.vibrate) navigator.vibrate([80, 40, 80])
  } catch { /* ignore */ }
}
