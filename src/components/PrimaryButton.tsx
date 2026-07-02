import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'success' | 'ghost'
  loading?: boolean
}

export default function PrimaryButton({
  children, variant = 'primary', loading, disabled, className = '', ...rest
}: Props) {
  const base = 'w-full rounded-2xl text-base font-semibold py-4 px-5 transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
  const styles = {
    primary: 'bg-violet-deep text-white hover:bg-violet-bright',
    success: 'bg-success text-white hover:bg-success-dark',
    ghost: 'bg-lavender text-violet-deep hover:bg-lavender-deep',
  }[variant]
  return (
    <button
      className={`${base} ${styles} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}
