import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileShell from '../components/MobileShell'
import PrimaryButton from '../components/PrimaryButton'
import EquipmentCapture from '../components/EquipmentCapture'
import { saveProfile, savePlan } from '../lib/storage'
import { generatePlan, profileToInput } from '../lib/api'
import type {
  DietPref, Equipment, EquipmentSource, Experience, Goal, MedicalCondition,
  Injury, SessionLength, UserProfile,
} from '../lib/types'

interface Draft {
  name: string
  age: string
  city: string
  goal?: Goal
  experience?: Experience
  days_per_week?: number
  session_length?: SessionLength
  equipment: Equipment[]
  equipment_source: EquipmentSource
  equipment_photo_urls: string[]
  diet_pref?: DietPref
  injuries: Injury[]
  medical_conditions: MedicalCondition[]
  other_constraints: string
}

const TOTAL_STEPS = 10

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({
    name: '', age: '', city: '',
    equipment: [], equipment_source: 'manual', equipment_photo_urls: [],
    injuries: [], medical_conditions: [], other_constraints: '',
  })
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  async function finish() {
    if (!draft.goal || !draft.experience || !draft.days_per_week
        || !draft.session_length || !draft.diet_pref) return
    setBuilding(true)
    setError(null)
    try {
      const profile: Omit<UserProfile, 'id' | 'created_at'> = {
        name: draft.name.trim() || 'Friend',
        age: Number(draft.age) || 25,
        city: draft.city.trim() || '',
        goal: draft.goal,
        experience: draft.experience,
        days_per_week: draft.days_per_week,
        session_length: draft.session_length,
        equipment: draft.equipment.length ? draft.equipment : ['bodyweight'],
        equipment_source: draft.equipment_source,
        equipment_photo_urls: draft.equipment_photo_urls,
        diet_pref: draft.diet_pref,
        injuries: draft.injuries.length ? draft.injuries : ['none'],
        medical_conditions: draft.medical_conditions.length ? draft.medical_conditions : ['none'],
        other_constraints: draft.other_constraints.trim(),
        current_week: 1,
      }
      const saved = await saveProfile(profile)
      const planJson = await generatePlan(profileToInput(saved, 1))
      await savePlan({
        week_number: 1,
        equipment_snapshot: saved.equipment,
        plan_json: planJson,
        source: 'initial',
      })
      nav('/today', { replace: true })
    } catch (e) {
      console.error(e)
      setError('Something went wrong building your plan. Try again?')
      setBuilding(false)
    }
  }

  if (building) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 border-4 border-violet-deep/20 border-t-violet-deep rounded-full animate-spin mb-6" />
          <h2 className="text-xl font-bold text-ink">Building your plan…</h2>
          <p className="mt-2 text-ink-soft text-sm">Personalizing for your equipment, injuries, and session length.</p>
          {error && (
            <div className="mt-6 w-full">
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <PrimaryButton onClick={finish}>Try again</PrimaryButton>
            </div>
          )}
        </div>
      </MobileShell>
    )
  }

  return (
    <MobileShell>
      <div className="flex flex-col flex-1 px-6 pt-8 pb-6">
        {/* progress bar */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={step === 0 ? () => nav('/') : back} className="text-ink-soft text-sm">
            ←
          </button>
          <div className="flex-1 h-1.5 bg-lavender rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-deep transition-all"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="text-xs text-ink-soft tabular-nums">{step + 1}/{TOTAL_STEPS}</span>
        </div>

        <div className="flex-1 flex flex-col">
          {step === 0 && <StepBasics draft={draft} setDraft={setDraft} />}

          {step === 1 && (
            <StepChoice
              title="What's your main goal?"
              subtitle="Pick the one closest to why you joined the gym."
              options={[
                { v: 'fat_loss', label: 'Fat loss', sub: 'Look leaner, lose weight' },
                { v: 'muscle_gain', label: 'Build muscle', sub: 'Get bigger, stronger' },
                { v: 'general_fitness', label: 'General fitness', sub: 'Feel better, more energy' },
                { v: 'strength', label: 'Get strong', sub: 'Lift heavier over time' },
              ]}
              value={draft.goal}
              onChange={(v) => setDraft({ ...draft, goal: v as Goal })}
            />
          )}

          {step === 2 && (
            <StepChoice
              title="How much gym experience do you have?"
              subtitle="Be honest — beginners get a safer plan."
              options={[
                { v: 'never', label: "I've never trained" },
                { v: 'under_1m', label: 'Under 1 month' },
                { v: '1_3m', label: '1–3 months' },
                { v: '3_12m', label: '3–12 months' },
                { v: 'over_1y', label: 'Over a year' },
              ]}
              value={draft.experience}
              onChange={(v) => setDraft({ ...draft, experience: v as Experience })}
            />
          )}

          {step === 3 && (
            <StepNumber
              title="How many days a week can you actually train?"
              subtitle="Pick what's realistic, not what's ideal."
              min={2} max={6}
              value={draft.days_per_week}
              onChange={(n) => setDraft({ ...draft, days_per_week: n })}
            />
          )}

          {step === 4 && (
            <StepChoice
              title="How long is each session?"
              subtitle="We'll build the day to actually fit inside this."
              options={[
                { v: '20', label: '20 min', sub: 'Short & sharp' },
                { v: '30', label: '30 min', sub: 'Sweet spot for most beginners' },
                { v: '45', label: '45 min', sub: "I've got the time" },
              ]}
              value={draft.session_length?.toString()}
              onChange={(v) => setDraft({ ...draft, session_length: Number(v) as SessionLength })}
            />
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-ink leading-tight">
                What&apos;s at your gym?
              </h2>
              <p className="mt-2 text-ink-soft text-sm">
                Snap a photo of your gym, pick manually, or both.
              </p>
              <div className="mt-6">
                <EquipmentCapture
                  value={draft.equipment}
                  source={draft.equipment_source}
                  photoUrls={draft.equipment_photo_urls}
                  onChange={({ equipment, source, photoUrls }) =>
                    setDraft({
                      ...draft,
                      equipment,
                      equipment_source: source,
                      equipment_photo_urls: photoUrls,
                    })
                  }
                />
              </div>
            </div>
          )}

          {step === 6 && (
            <StepChoice
              title="Your diet preference?"
              subtitle="So we suggest meals you actually eat."
              options={[
                { v: 'veg', label: 'Vegetarian' },
                { v: 'egg_veg', label: 'Eggetarian' },
                { v: 'non_veg', label: 'Non-vegetarian' },
              ]}
              value={draft.diet_pref}
              onChange={(v) => setDraft({ ...draft, diet_pref: v as DietPref })}
            />
          )}

          {step === 7 && (
            <StepMulti
              title="Any injuries?"
              subtitle="So we keep painful movements out of your plan. Tap 'None' if you're good."
              options={[
                { v: 'none', label: 'None' },
                { v: 'lower_back', label: 'Lower back' },
                { v: 'knee', label: 'Knee' },
                { v: 'shoulder', label: 'Shoulder' },
                { v: 'neck', label: 'Neck' },
                { v: 'wrist', label: 'Wrist' },
              ]}
              value={draft.injuries}
              onChange={(values) => setDraft({ ...draft, injuries: values as Injury[] })}
              required
            />
          )}

          {step === 8 && (
            <StepMulti
              title="Any medical conditions?"
              subtitle="We adjust intensity for safety. This is mandatory."
              options={[
                { v: 'none', label: 'None' },
                { v: 'heart_condition', label: 'Heart condition' },
                { v: 'high_bp', label: 'High blood pressure' },
                { v: 'diabetes', label: 'Diabetes' },
                { v: 'asthma', label: 'Asthma' },
                { v: 'pregnancy', label: 'Pregnant' },
              ]}
              value={draft.medical_conditions}
              onChange={(values) => setDraft({ ...draft, medical_conditions: values as MedicalCondition[] })}
              required
            />
          )}

          {step === 9 && (
            <div>
              <h2 className="text-2xl font-bold text-ink leading-tight">
                Anything else?
              </h2>
              <p className="mt-2 text-ink-soft text-sm">
                Free-text. Example: &quot;no jumping — downstairs neighbour&quot;, &quot;evenings only&quot;.
              </p>
              <textarea
                value={draft.other_constraints}
                onChange={(e) => setDraft({ ...draft, other_constraints: e.target.value })}
                placeholder="Optional — leave blank if nothing comes to mind."
                rows={4}
                className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-ink focus:border-violet-deep focus:outline-none resize-none"
              />
              <p className="mt-2 text-xs text-ink-soft italic">
                The plan will honour what you write here.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <PrimaryButton
            onClick={step === TOTAL_STEPS - 1 ? finish : next}
            disabled={!canContinue(step, draft)}
          >
            {step === TOTAL_STEPS - 1 ? 'Build my plan' : 'Continue'}
          </PrimaryButton>
        </div>
      </div>
    </MobileShell>
  )
}

function canContinue(step: number, d: Draft) {
  if (step === 0) return d.name.trim().length > 0 && Number(d.age) >= 13
  if (step === 1) return !!d.goal
  if (step === 2) return !!d.experience
  if (step === 3) return !!d.days_per_week
  if (step === 4) return !!d.session_length
  if (step === 5) return d.equipment.length > 0
  if (step === 6) return !!d.diet_pref
  if (step === 7) return d.injuries.length > 0
  if (step === 8) return d.medical_conditions.length > 0
  if (step === 9) return true
  return false
}

function StepBasics({
  draft, setDraft,
}: { draft: Draft, setDraft: (d: Draft) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink leading-tight">First, the basics.</h2>
      <p className="mt-2 text-ink-soft text-sm">We&apos;ll use this to talk to you, not to spam you.</p>

      <div className="mt-8 space-y-4">
        <Field label="Your name">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. Rohan"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-ink focus:border-violet-deep focus:outline-none"
          />
        </Field>
        <Field label="Age">
          <input
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: e.target.value.replace(/\D/g, '') })}
            placeholder="e.g. 25"
            inputMode="numeric"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-ink focus:border-violet-deep focus:outline-none"
          />
        </Field>
        <Field label="City (optional)">
          <input
            value={draft.city}
            onChange={(e) => setDraft({ ...draft, city: e.target.value })}
            placeholder="e.g. Pune"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-ink focus:border-violet-deep focus:outline-none"
          />
        </Field>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

interface Option { v: string, label: string, sub?: string }

function StepChoice({
  title, subtitle, options, value, onChange,
}: {
  title: string, subtitle?: string, options: Option[], value: string | number | undefined,
  onChange: (v: string) => void,
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink leading-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-ink-soft text-sm">{subtitle}</p>}
      <div className="mt-8 space-y-2.5">
        {options.map((o) => {
          const active = String(value) === String(o.v)
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={`w-full text-left rounded-2xl px-5 py-4 border-2 transition ${
                active
                  ? 'border-violet-deep bg-lavender'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="font-semibold text-ink">{o.label}</div>
              {o.sub && <div className="text-sm text-ink-soft mt-0.5">{o.sub}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepMulti({
  title, subtitle, options, value, onChange, required,
}: {
  title: string, subtitle?: string, options: Option[], value: string[],
  onChange: (v: string[]) => void, required?: boolean,
}) {
  function toggle(v: string) {
    if (v === 'none') {
      onChange(value.includes('none') ? [] : ['none'])
      return
    }
    const next = value.filter((x) => x !== 'none')
    if (next.includes(v)) onChange(next.filter((x) => x !== v))
    else onChange([...next, v])
  }
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink leading-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-ink-soft text-sm">{subtitle}</p>}
      <div className="mt-8 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value.includes(o.v)
          return (
            <button
              key={o.v}
              onClick={() => toggle(o.v)}
              className={`rounded-full px-4 py-2.5 text-sm font-medium border-2 transition ${
                active
                  ? 'border-violet-deep bg-violet-deep text-white'
                  : 'border-gray-200 bg-white text-ink hover:border-gray-300'
              }`}
            >
              {o.label}
            </button>
          )
        })}
      </div>
      {required && (
        <p className="text-xs text-ink-soft mt-4 italic">
          This question is mandatory — your plan is built around it.
        </p>
      )}
    </div>
  )
}

function StepNumber({
  title, subtitle, min, max, value, onChange,
}: {
  title: string, subtitle?: string, min: number, max: number,
  value: number | undefined, onChange: (n: number) => void,
}) {
  const opts = []
  for (let i = min; i <= max; i++) opts.push(i)
  return (
    <div>
      <h2 className="text-2xl font-bold text-ink leading-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-ink-soft text-sm">{subtitle}</p>}
      <div className="mt-10 grid grid-cols-5 gap-2.5">
        {opts.map((n) => {
          const active = value === n
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`aspect-square rounded-2xl text-2xl font-bold border-2 transition ${
                active
                  ? 'border-violet-deep bg-violet-deep text-white'
                  : 'border-gray-200 bg-white text-ink hover:border-gray-300'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-ink-soft mt-4 text-center">days per week</p>
    </div>
  )
}
