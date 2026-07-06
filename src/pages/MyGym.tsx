import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, ArrowLeft, RefreshCw, X, Check } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import PrimaryButton from '../components/PrimaryButton'
import EquipmentCapture from '../components/EquipmentCapture'
import { loadProfile, updateProfile } from '../lib/storage'
import { regenerateWeekPreservingCompleted } from '../lib/regenerate'
import { useAuthUser } from '../hooks/useAuthUser'
import { TRAINING_STYLE_LABELS } from '../lib/types'
import type { Equipment, TrainingStyle, UserProfile } from '../lib/types'

export default function MyGym() {
  const nav = useNavigate()
  const { loading: authLoading, user } = useAuthUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [styles, setStyles] = useState<TrainingStyle[]>(['strength_cardio'])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { nav('/', { replace: true }); return }
    loadProfile().then((p) => {
      if (!p) { nav('/onboarding', { replace: true }); return }
      setProfile(p)
      setEquipment(p.equipment)
      setStyles(p.training_styles ?? ['strength_cardio'])
    })
  }, [authLoading, user?.uid, nav])

  const equipmentDirty =
    !!profile && JSON.stringify([...equipment].sort()) !== JSON.stringify([...profile.equipment].sort())
  const stylesDirty =
    !!profile && JSON.stringify([...styles].sort()) !== JSON.stringify([...(profile.training_styles ?? [])].sort())
  const dirty = equipmentDirty || stylesDirty

  async function save() {
    if (!profile) return
    setSaving(true)
    try {
      const merged = await updateProfile({
        equipment,
        equipment_source: 'manual',
        equipment_photo_urls: [],
        training_styles: styles.length ? styles : ['strength_cardio'],
      })
      setProfile(merged)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  async function doRegenerate() {
    if (!profile) return
    setRegenerating(true)
    try {
      const merged = await updateProfile({
        equipment,
        equipment_source: 'manual',
        equipment_photo_urls: [],
        training_styles: styles.length ? styles : ['strength_cardio'],
      })
      setProfile(merged)
      await regenerateWeekPreservingCompleted(merged)
      setConfirmOpen(false)
      nav('/today', { replace: true })
    } finally {
      setRegenerating(false)
    }
  }

  function toggleStyle(s: TrainingStyle) {
    const has = styles.includes(s)
    if (has) {
      // Never leave the user with zero styles picked.
      if (styles.length === 1) return
      setStyles(styles.filter((x) => x !== s))
    } else {
      setStyles([...styles, s])
    }
  }

  if (!profile) {
    return (
      <MobileShell bottomBar={<BottomNav />}>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-violet-deep animate-spin" />
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell bottomBar={<BottomNav />}>
      <div className="flex-1 px-6 pt-8 pb-6">
        <button onClick={() => nav(-1)} className="text-ink-soft text-sm flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-xs font-semibold text-violet-deep uppercase tracking-wider">My Gym</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">What you train with.</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Change what you have or how you like to train. Regenerate the week when you want the plan to catch up.
        </p>

        {/* Training styles */}
        <section className="mt-6">
          <h2 className="text-sm font-bold text-ink-soft uppercase tracking-wider mb-2">Training styles</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TRAINING_STYLE_LABELS) as TrainingStyle[]).map((s) => {
              const active = styles.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleStyle(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition ${
                    active
                      ? 'border-violet-deep bg-violet-deep text-white'
                      : 'border-gray-200 bg-white text-ink hover:border-gray-300'
                  }`}
                >
                  {TRAINING_STYLE_LABELS[s]}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-ink-soft italic">
            Pick one or more. Yoga and Mobility land as active-recovery days alongside Strength &amp; Cardio.
          </p>
        </section>

        {/* Equipment */}
        <section className="mt-8">
          <h2 className="text-sm font-bold text-ink-soft uppercase tracking-wider mb-2">Equipment</h2>
          <EquipmentCapture value={equipment} onChange={(next) => setEquipment(next)} />
        </section>

        {savedAt && !dirty && (
          <p className="mt-6 text-sm text-success-dark">
            ✓ Saved. Regenerate to have this week&apos;s upcoming days catch up.
          </p>
        )}

        <div className="mt-8 space-y-3">
          <PrimaryButton onClick={save} disabled={!dirty || equipment.length === 0 || styles.length === 0} loading={saving}>
            <span className="inline-flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save changes
            </span>
          </PrimaryButton>

          <button
            onClick={() => setConfirmOpen(true)}
            disabled={regenerating || equipment.length === 0 || styles.length === 0}
            className="w-full rounded-2xl border-2 border-violet-deep bg-white text-violet-deep py-3.5 font-semibold flex items-center justify-center gap-2 hover:bg-lavender transition active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate this week&apos;s plan
          </button>
          <p className="text-[10px] text-center text-ink-soft">
            Days you&apos;ve already trained this week stay untouched. Only the upcoming days get rebuilt.
          </p>
        </div>
      </div>

      {confirmOpen && (
        <RegenerateConfirm
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doRegenerate}
          loading={regenerating}
          styles={styles}
        />
      )}
    </MobileShell>
  )
}

function RegenerateConfirm({
  onCancel, onConfirm, loading, styles,
}: {
  onCancel: () => void; onConfirm: () => void; loading: boolean;
  styles: TrainingStyle[];
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onCancel}>
      <div
        className="w-full max-w-[440px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-lavender flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-violet-deep" />
          </div>
          <button onClick={onCancel} className="p-1 text-ink-soft" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <h2 className="text-xl font-bold text-ink">Regenerate your plan?</h2>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed">
          Your upcoming training days this week will be rebuilt to match your new preferences — the styles you&apos;ve picked and the equipment you have.
        </p>
        <p className="mt-3 text-sm text-ink-soft leading-relaxed">
          Days you&apos;ve already trained (any check-ins from earlier this week) will stay exactly as they are. Your plan for next week and beyond will follow the new choices too.
        </p>

        <div className="mt-4 rounded-2xl bg-lavender border border-violet-deep/15 p-3">
          <p className="text-[10px] font-bold text-violet-deep uppercase tracking-wider mb-1.5">
            Styles the new week will use
          </p>
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => (
              <span key={s} className="text-xs rounded-full bg-white text-violet-deep px-3 py-1 border border-violet-deep/20 font-medium">
                {TRAINING_STYLE_LABELS[s]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl border border-gray-200 py-3 font-semibold text-ink hover:bg-gray-50 disabled:opacity-50"
          >
            Not now
          </button>
          <PrimaryButton onClick={onConfirm} loading={loading}>
            <span className="inline-flex items-center justify-center gap-2">
              <Check className="w-5 h-5" strokeWidth={3} />
              Yes, regenerate
            </span>
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
