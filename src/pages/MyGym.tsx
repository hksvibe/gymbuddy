import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import BottomNav from '../components/BottomNav'
import PrimaryButton from '../components/PrimaryButton'
import EquipmentCapture from '../components/EquipmentCapture'
import { loadProfile, updateProfile } from '../lib/storage'
import { useAuthUser } from '../hooks/useAuthUser'
import type { Equipment, EquipmentSource, UserProfile } from '../lib/types'

export default function MyGym() {
  const nav = useNavigate()
  const { loading: authLoading, user } = useAuthUser()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [source, setSource] = useState<EquipmentSource>('manual')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { nav('/', { replace: true }); return }
    loadProfile().then((p) => {
      if (!p) { nav('/onboarding', { replace: true }); return }
      setProfile(p)
      setEquipment(p.equipment)
      setSource(p.equipment_source)
      setPhotoUrls(p.equipment_photo_urls ?? [])
    })
  }, [authLoading, user?.uid, nav])

  const dirty =
    !!profile && (
      JSON.stringify([...equipment].sort()) !== JSON.stringify([...profile.equipment].sort())
      || source !== profile.equipment_source
      || JSON.stringify(photoUrls) !== JSON.stringify(profile.equipment_photo_urls ?? [])
    )

  async function save() {
    if (!profile) return
    setSaving(true)
    try {
      const merged = await updateProfile({
        equipment,
        equipment_source: source,
        equipment_photo_urls: photoUrls,
      })
      setProfile(merged)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
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
          Update this anytime — your next plan rebuilds around it.
        </p>

        <div className="mt-6">
          <EquipmentCapture
            value={equipment}
            source={source}
            photoUrls={photoUrls}
            onChange={({ equipment: e, source: s, photoUrls: u }) => {
              setEquipment(e); setSource(s); setPhotoUrls(u)
            }}
          />
        </div>

        {savedAt && !dirty && (
          <p className="mt-4 text-sm text-success-dark">
            ✓ Saved. Your next plan will use the updated list.
          </p>
        )}

        <div className="mt-8">
          <PrimaryButton onClick={save} disabled={!dirty || equipment.length === 0} loading={saving}>
            <span className="inline-flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save equipment
            </span>
          </PrimaryButton>
        </div>
      </div>
    </MobileShell>
  )
}
