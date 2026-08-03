import { cn } from '@/lib/utils'

export function Logo({
  className,
  inverted = false,
}: {
  className?: string
  inverted?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-[10px] font-display text-[15px] leading-none',
          inverted ? 'bg-white text-ink' : 'bg-ink text-white',
        )}
        aria-hidden
      >
        IC
      </span>
      <span
        className={cn(
          'text-[19px] font-extrabold tracking-[-0.02em]',
          inverted ? 'text-white' : 'text-ink',
        )}
      >
        IDJÔ<span className={inverted ? 'text-white/60' : 'text-ink-muted'}> CV</span>
      </span>
    </span>
  )
}
