import { useState } from 'react'
import { ShieldCheck, Stethoscope, Check } from 'lucide-react'
import PrimaryButton from './PrimaryButton'
import {
  CONSENT_ACCEPT_LABELS, CONSENT_BULLETS, CONSENT_TITLES, CONSENT_VERSIONS,
} from '../lib/consent'
import type { ConsentKind } from '../lib/types'

interface Props {
  kind: ConsentKind
  onAccept: () => void | Promise<void>
  submittingLabel?: string
}

export default function ConsentScreen({ kind, onAccept, submittingLabel }: Props) {
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const Icon = kind === 'chronic_condition' ? Stethoscope : ShieldCheck
  const tint = kind === 'chronic_condition' ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-violet-deep bg-lavender border-violet-deep/20'

  async function proceed() {
    if (!checked) return
    setSubmitting(true)
    try { await onAccept() } finally { setSubmitting(false) }
  }

  return (
    <div className="flex flex-col flex-1">
      <div className={`rounded-2xl border ${tint} p-4 flex items-start gap-3`}>
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-lg font-bold leading-snug">{CONSENT_TITLES[kind]}</h2>
          <p className="text-xs mt-0.5 opacity-80">Please read this before we build your plan.</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {CONSENT_BULLETS[kind].map((b, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-deep mt-2 flex-shrink-0" />
            <span className="text-sm text-ink leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>

      <label className="mt-6 flex items-start gap-3 rounded-2xl border-2 border-gray-100 p-3 cursor-pointer select-none">
        <span
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
            checked ? 'border-violet-deep bg-violet-deep' : 'border-gray-300 bg-white'
          }`}
        >
          {checked && <Check className="w-4 h-4 text-white" strokeWidth={3.5} />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span className="text-sm font-medium text-ink leading-snug">
          {CONSENT_ACCEPT_LABELS[kind]}
        </span>
      </label>

      <p className="text-[10px] text-ink-soft mt-2 text-center">
        Version {CONSENT_VERSIONS[kind]} · your acceptance is logged with a timestamp.
      </p>

      <div className="mt-6">
        <PrimaryButton onClick={proceed} disabled={!checked || submitting}>
          {submitting ? (submittingLabel ?? 'Saving…') : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  )
}
