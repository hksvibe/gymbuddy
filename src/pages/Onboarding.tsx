import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ShieldCheck, Stethoscope } from 'lucide-react'
import MobileShell from '../components/MobileShell'
import PrimaryButton from '../components/PrimaryButton'
import EquipmentCapture from '../components/EquipmentCapture'
import { saveProfile, savePlan } from '../lib/storage'
import { generatePlan, profileToInput } from '../lib/api'
import { logEvent } from '../lib/analytics'
import {
  CONSENT_BULLETS, CONSENT_TITLES, CONSENT_VERSIONS,
  recordConsent, requiresChronicConsent,
} from '../lib/consent'
import type {
  DietPref, Equipment, Experience, Goal, MedicalCondition,
  Injury, SessionLength, TrainingStyle, UserProfile,
} from '../lib/types'
import { TRAINING_STYLE_LABELS } from '../lib/types'

interface Draft {
  // Step 1 — About you
  name: string
  age: string
  city: string
  height_cm: string
  weight_kg: string
  // Step 2 — Your training
  goal?: Goal
  experience?: Experience
  days_per_week?: number
  session_length?: SessionLength
  training_styles: TrainingStyle[]
  // Step 3 — Around you
  equipment: Equipment[]
  diet_pref?: DietPref
  other_constraints: string
  // Step 4 — Health + consent
  injuries: Injury[]
  medical_conditions: MedicalCondition[]
  consent_general: boolean
  consent_chronic: boolean
}

const TOTAL_STEPS = 4

export default function Onboarding() {
  const nav = useNavigate()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({
    name: '', age: '', city: '', height_cm: '', weight_kg: '',
    training_styles: ['strength_cardio'],
    equipment: [],
    injuries: [], medical_conditions: [],
    other_constraints: '',
    consent_general: false, consent_chronic: false,
  })
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const chronicRequired = requiresChronicConsent(draft.medical_conditions)

  // Fire onboarding_started analytics event exactly once per session.
  useState(() => { logEvent('onboarding_started'); return null })

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  async function finish() {
    if (!draft.goal || !draft.experience || !draft.days_per_week
        || !draft.session_length || !draft.diet_pref) return
    if (!draft.consent_general) return
    if (chronicRequired && !draft.consent_chronic) return

    setBuilding(true); setError(null)
    try {
      const profile: Omit<UserProfile, 'id' | 'created_at'> = {
        name: draft.name.trim() || 'Friend',
        age: Number(draft.age) || 25,
        city: draft.city.trim() || '',
        height_cm: Number(draft.height_cm) || 170,
        weight_kg: Number(draft.weight_kg) || 70,
        goal: draft.goal,
        experience: draft.experience,
        days_per_week: draft.days_per_week,
        session_length: draft.session_length,
        equipment: draft.equipment.length ? draft.equipment : ['bodyweight'],
        equipment_source: 'manual',
        equipment_photo_urls: [],
        diet_pref: draft.diet_pref,
        injuries: draft.injuries.length ? draft.injuries : ['none'],
        medical_conditions: draft.medical_conditions.length ? draft.medical_conditions : ['none'],
        other_constraints: draft.other_constraints.trim(),
        training_styles: draft.training_styles.length > 0
          ? draft.training_styles
          : ['strength_cardio'],
        current_week: 1,
      }
      const saved = await saveProfile(profile)

      // Log the consents against the newly-saved user, preserving audit trail.
      await recordConsent({
        kind: 'general_ai',
        medical_conditions: profile.medical_conditions,
        injuries: profile.injuries,
      })
      if (chronicRequired) {
        await recordConsent({
          kind: 'chronic_condition',
          medical_conditions: profile.medical_conditions,
          injuries: profile.injuries,
        })
      }

      const planJson = await generatePlan(profileToInput(saved, 1))
      await savePlan({
        week_number: 1,
        equipment_snapshot: saved.equipment,
        plan_json: planJson,
        source: 'initial',
      })
      logEvent('onboarding_completed', {
        goal: profile.goal,
        experience: profile.experience,
        days_per_week: profile.days_per_week,
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
          <p className="mt-2 text-ink-soft text-sm">Personalizing for your body, equipment, and goals.</p>
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
        <div className="flex items-center gap-2 mb-6">
          <button onClick={step === 0 ? () => nav('/') : back} className="text-ink-soft text-sm">←</button>
          <div className="flex-1 h-1.5 bg-lavender rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-deep transition-all"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <span className="text-xs text-ink-soft tabular-nums">{step + 1}/{TOTAL_STEPS}</span>
        </div>

        {step === 0 && <StepAboutYou draft={draft} setDraft={setDraft} />}
        {step === 1 && <StepTraining draft={draft} setDraft={setDraft} />}
        {step === 2 && <StepAroundYou draft={draft} setDraft={setDraft} />}
        {step === 3 && (
          <StepHealthConsent
            draft={draft}
            setDraft={setDraft}
            chronicRequired={chronicRequired}
          />
        )}

        <div className="mt-6">
          <PrimaryButton
            onClick={step === TOTAL_STEPS - 1 ? finish : next}
            disabled={!canContinue(step, draft, chronicRequired)}
          >
            {step === TOTAL_STEPS - 1 ? 'Build my plan' : 'Continue'}
          </PrimaryButton>
        </div>
      </div>
    </MobileShell>
  )
}

function canContinue(step: number, d: Draft, chronicRequired: boolean): boolean {
  if (step === 0) {
    const h = Number(d.height_cm), w = Number(d.weight_kg)
    return d.name.trim().length > 0
      && Number(d.age) >= 13
      && h >= 120 && h <= 230
      && w >= 30 && w <= 250
  }
  if (step === 1) {
    return !!d.goal && !!d.experience && !!d.days_per_week && !!d.session_length
      && d.training_styles.length > 0
  }
  if (step === 2) {
    return d.equipment.length > 0 && !!d.diet_pref
  }
  if (step === 3) {
    if (d.injuries.length === 0 || d.medical_conditions.length === 0) return false
    if (!d.consent_general) return false
    if (chronicRequired && !d.consent_chronic) return false
    return true
  }
  return false
}

// ---------- Step 1 · About you ----------
function StepAboutYou({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const h = Number(draft.height_cm), w = Number(draft.weight_kg)
  const bmi = h > 0 && w > 0 ? (w / ((h / 100) ** 2)).toFixed(1) : null

  return (
    <div className="flex-1">
      <div className="mb-5 rounded-2xl bg-lavender border border-violet-deep/15 p-3.5">
        <p className="text-[10px] text-violet-deep font-bold uppercase tracking-wider mb-1">Heads up ✨</p>
        <p className="text-sm text-ink leading-snug">
          Just 4 quick steps. Every answer sharpens your plan — safer, more personal, less generic.
        </p>
      </div>

      <SectionTitle title="About you" subtitle="Basics + body — so we can size everything right." />

      <div className="space-y-3">
        <Field label="Your name">
          <TextInput value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="e.g. Rohan" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <TextInput value={draft.age} onChange={(v) => setDraft({ ...draft, age: v.replace(/\D/g, '') })} placeholder="25" inputMode="numeric" />
          </Field>
          <Field label="City (optional)">
            <TextInput value={draft.city} onChange={(v) => setDraft({ ...draft, city: v })} placeholder="Pune" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (cm)">
            <TextInput value={draft.height_cm} onChange={(v) => setDraft({ ...draft, height_cm: v.replace(/\D/g, '').slice(0, 3) })} placeholder="172" inputMode="numeric" />
          </Field>
          <Field label="Weight (kg)">
            <TextInput value={draft.weight_kg} onChange={(v) => setDraft({ ...draft, weight_kg: v.replace(/[^\d.]/g, '').slice(0, 5) })} placeholder="68" inputMode="decimal" />
          </Field>
        </div>
      </div>

      {bmi && Number(bmi) > 0 && (
        <div className="mt-4 rounded-2xl bg-lavender border border-violet-deep/15 px-4 py-3 flex items-baseline justify-between">
          <div>
            <p className="text-[10px] text-violet-deep font-bold uppercase tracking-wider">Your BMI</p>
            <p className="text-xs text-ink-soft mt-0.5">
              {Number(bmi) < 18.5 ? 'Under normal range' :
               Number(bmi) < 25 ? 'In normal range' :
               Number(bmi) < 30 ? 'Above normal range' :
               'Well above normal range'} · non-medical guide
            </p>
          </div>
          <p className="text-2xl font-bold text-violet-deep tabular-nums">{bmi}</p>
        </div>
      )}
    </div>
  )
}

// ---------- Step 2 · Your training ----------
function StepTraining({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  return (
    <div className="flex-1">
      <SectionTitle title="Your training" subtitle="What you want and what fits your life." />

      <SubLabel>Main goal</SubLabel>
      <ChoiceGrid<Goal>
        options={[
          { v: 'fat_loss', label: 'Fat loss' },
          { v: 'muscle_gain', label: 'Build muscle' },
          { v: 'general_fitness', label: 'General fitness' },
          { v: 'strength', label: 'Get strong' },
        ]}
        value={draft.goal}
        onChange={(v) => setDraft({ ...draft, goal: v })}
      />

      <SubLabel>How much you've trained</SubLabel>
      <ChoiceGrid<Experience>
        options={[
          { v: 'never', label: 'Never' },
          { v: 'under_1m', label: 'Under 1m' },
          { v: '1_3m', label: '1–3m' },
          { v: '3_12m', label: '3–12m' },
          { v: 'over_1y', label: 'Over 1y' },
        ]}
        value={draft.experience}
        onChange={(v) => setDraft({ ...draft, experience: v })}
      />

      <SubLabel>Days per week you can train</SubLabel>
      <div className="grid grid-cols-5 gap-2">
        {[2, 3, 4, 5, 6].map((n) => {
          const active = draft.days_per_week === n
          return (
            <button
              key={n}
              onClick={() => setDraft({ ...draft, days_per_week: n })}
              className={`aspect-square rounded-xl text-xl font-bold border-2 transition ${
                active ? 'border-violet-deep bg-violet-deep text-white'
                       : 'border-gray-200 bg-white text-ink hover:border-gray-300'
              }`}
            >
              {n}
            </button>
          )
        })}
      </div>

      <SubLabel>Session length</SubLabel>
      <ChoiceGrid<SessionLength>
        options={[
          { v: 25, label: '25 min' },
          { v: 30, label: '30 min' },
          { v: 45, label: '45 min' },
        ]}
        value={draft.session_length}
        onChange={(v) => setDraft({ ...draft, session_length: v })}
      />

      <SubLabel>Training styles you want in your week</SubLabel>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TRAINING_STYLE_LABELS) as TrainingStyle[]).map((s) => {
          const active = draft.training_styles.includes(s)
          return (
            <button
              key={s}
              onClick={() => setDraft({
                ...draft,
                training_styles: active
                  ? draft.training_styles.filter((x) => x !== s)
                  : [...draft.training_styles, s],
              })}
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
      <p className="mt-2 text-[10px] text-ink-soft italic">
        Pick one or more. Your week is split across them — Strength &amp; Cardio stays your backbone; Yoga and Mobility add active-recovery days.
      </p>
    </div>
  )
}

// ---------- Step 3 · Around you ----------
function StepAroundYou({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  return (
    <div className="flex-1">
      <SectionTitle title="Around you" subtitle="Equipment, food, and anything special." />

      <SubLabel>Equipment (tap what you have)</SubLabel>
      <EquipmentCapture value={draft.equipment} onChange={(equipment) => setDraft({ ...draft, equipment })} />

      <SubLabel>Diet preference</SubLabel>
      <ChoiceGrid<DietPref>
        options={[
          { v: 'veg', label: 'Vegetarian' },
          { v: 'egg_veg', label: 'Eggetarian' },
          { v: 'non_veg', label: 'Non-veg' },
        ]}
        value={draft.diet_pref}
        onChange={(v) => setDraft({ ...draft, diet_pref: v })}
      />

      <SubLabel>Anything else? (optional)</SubLabel>
      <textarea
        value={draft.other_constraints}
        onChange={(e) => setDraft({ ...draft, other_constraints: e.target.value })}
        placeholder='e.g. "no jumping — downstairs neighbour", "evenings only"'
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-ink text-sm focus:border-violet-deep focus:outline-none resize-none"
      />
    </div>
  )
}

// ---------- Step 4 · Health + consent ----------
function StepHealthConsent({
  draft, setDraft, chronicRequired,
}: {
  draft: Draft; setDraft: (d: Draft) => void; chronicRequired: boolean;
}) {
  return (
    <div className="flex-1">
      <SectionTitle title="Health & consent" subtitle="Last one — keeps you safe." />

      <SubLabel>Any injuries?</SubLabel>
      <MultiChips
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
      />

      <SubLabel>Any medical conditions?</SubLabel>
      <MultiChips
        options={[
          { v: 'none', label: 'None' },
          { v: 'heart_condition', label: 'Heart' },
          { v: 'high_bp', label: 'High BP' },
          { v: 'diabetes', label: 'Diabetes' },
          { v: 'asthma', label: 'Asthma' },
          { v: 'pregnancy', label: 'Pregnant' },
        ]}
        value={draft.medical_conditions}
        onChange={(values) => setDraft({ ...draft, medical_conditions: values as MedicalCondition[] })}
      />

      <SubLabel>Consent</SubLabel>
      <ConsentCard
        id="consent-general"
        icon={<ShieldCheck className="w-4 h-4" />}
        title={CONSENT_TITLES.general_ai}
        bullets={CONSENT_BULLETS.general_ai}
        version={CONSENT_VERSIONS.general_ai}
        checked={draft.consent_general}
        onChange={(v) => setDraft({ ...draft, consent_general: v })}
        acceptLabel="I understand and agree"
        tint="violet"
      />
      {chronicRequired && (
        <div className="mt-3">
          <ConsentCard
            id="consent-chronic"
            icon={<Stethoscope className="w-4 h-4" />}
            title={CONSENT_TITLES.chronic_condition}
            bullets={CONSENT_BULLETS.chronic_condition}
            version={CONSENT_VERSIONS.chronic_condition}
            checked={draft.consent_chronic}
            onChange={(v) => setDraft({ ...draft, consent_chronic: v })}
            acceptLabel="I will consult my doctor"
            tint="amber"
          />
        </div>
      )}
    </div>
  )
}

// ============================= shared primitives =============================

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold text-ink leading-tight">{title}</h2>
      <p className="mt-1 text-xs text-ink-soft">{subtitle}</p>
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 mb-2 text-[11px] font-bold text-ink-soft uppercase tracking-wider">
      {children}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function TextInput({
  value, onChange, placeholder, inputMode,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  inputMode?: 'text' | 'numeric' | 'decimal';
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode ?? 'text'}
      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-ink text-sm focus:border-violet-deep focus:outline-none"
    />
  )
}

interface ChoiceGridOption<T> { v: T; label: string }
function ChoiceGrid<T extends string | number>({
  options, value, onChange, cols,
}: {
  options: ChoiceGridOption<T>[]; value: T | undefined; onChange: (v: T) => void; cols?: number;
}) {
  const gridClass = cols === 5 ? 'grid-cols-5' : options.length >= 4 ? 'grid-cols-2' : 'grid-cols-3'
  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((o) => {
        const active = value === o.v
        return (
          <button
            key={String(o.v)}
            onClick={() => onChange(o.v)}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold border-2 transition ${
              active ? 'border-violet-deep bg-lavender text-violet-deep'
                     : 'border-gray-200 bg-white text-ink hover:border-gray-300'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function MultiChips({
  options, value, onChange,
}: {
  options: { v: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    if (v === 'none') { onChange(value.includes('none') ? [] : ['none']); return }
    const next = value.filter((x) => x !== 'none')
    if (next.includes(v)) onChange(next.filter((x) => x !== v))
    else onChange([...next, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.v)
        return (
          <button
            key={o.v}
            onClick={() => toggle(o.v)}
            className={`rounded-full px-3.5 py-2 text-sm font-medium border-2 transition ${
              active ? 'border-violet-deep bg-violet-deep text-white'
                     : 'border-gray-200 bg-white text-ink hover:border-gray-300'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function ConsentCard({
  id, icon, title, bullets, version, checked, onChange, acceptLabel, tint,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  bullets: string[];
  version: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  acceptLabel: string;
  tint: 'violet' | 'amber';
}) {
  const tintClass = tint === 'amber'
    ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-lavender border-violet-deep/20 text-violet-deep'

  // Wrap the whole accept row in a button — the tap target is unambiguous
  // and React state updates every time. (sr-only inputs behave inconsistently
  // when triggered via label click on some browsers.)
  return (
    <div className={`rounded-2xl border p-3 ${tintClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <p className="text-sm font-bold">{title}</p>
      </div>
      <ul className="space-y-1 mb-3">
        {bullets.map((b, i) => (
          <li key={i} className="text-xs text-ink leading-snug flex items-start gap-1.5">
            <span className="w-1 h-1 rounded-full bg-current mt-1.5 opacity-60 flex-shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-labelledby={`${id}-label`}
        className="w-full flex items-start gap-2.5 cursor-pointer select-none bg-white/80 rounded-xl px-3 py-2.5 border border-current/10 text-left transition active:scale-[0.99]"
      >
        <span
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
            checked ? 'border-violet-deep bg-violet-deep' : 'border-gray-300 bg-white'
          }`}
        >
          {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3.5} />}
        </span>
        <span id={`${id}-label`} className="text-xs font-semibold text-ink leading-snug">{acceptLabel}</span>
      </button>
      <p className="text-[9px] text-ink-soft mt-2">Version {version} · logged with a timestamp on tap.</p>
    </div>
  )
}
