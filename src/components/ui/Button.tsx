import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40'

const variants: Record<Variant, string> = {
  primary:
    'bg-azur-btn text-white shadow-[0_10px_30px_-12px_rgba(27,98,214,.8)] hover:brightness-110 hover:shadow-float active:scale-[.98]',
  secondary: 'bg-azur-100 text-navy-700 hover:bg-azur-200 active:scale-[.98]',
  outline:
    'border border-azur-200 bg-white text-navy-700 hover:border-azur-500 hover:bg-azur-50 active:scale-[.98]',
  ghost: 'text-ink hover:bg-azur-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-[15px] sm:h-14 sm:px-8',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  prefetch,
}: {
  href: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  prefetch?: boolean
}) {
  const isExternal = href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')
  const classes = cn(base, variants[variant], sizes[size], className)

  if (isExternal) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} prefetch={prefetch}>
      {children}
    </Link>
  )
}
