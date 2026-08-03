'use client'

import type { ReactNode } from 'react'
import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span> : null}
    </label>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <input
      type={type}
      className="field"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <textarea
      className="field resize-y leading-relaxed"
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}

export function RangeInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-cloud-300 accent-ink"
    />
  )
}

export function Accordion({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string
  count?: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="border-b border-cloud-300">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-cloud"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-ink">{title}</span>
          {typeof count === 'number' ? (
            <span className="rounded-full bg-cloud-200 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={17}
          className={cn('shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open ? <div className="px-5 pb-6">{children}</div> : null}
    </section>
  )
}

export function ItemCard({
  index,
  title,
  onRemove,
  onMoveUp,
  onMoveDown,
  children,
}: {
  index: number
  title: string
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  children: ReactNode
}) {
  return (
    <div className="mb-4 rounded-xl border border-cloud-300 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
          <GripVertical size={14} className="text-cloud-400" />
          {title} {index + 1}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-ink-muted hover:bg-cloud-200 hover:text-ink"
            aria-label="Monter"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            className="rounded-md px-1.5 py-1 text-[11px] font-semibold text-ink-muted hover:bg-cloud-200 hover:text-ink"
            aria-label="Descendre"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md p-1.5 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
            aria-label="Supprimer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cloud-400 py-3 text-sm font-semibold text-ink-muted transition-colors hover:border-ink hover:bg-cloud hover:text-ink"
    >
      <Plus size={15} />
      {label}
    </button>
  )
}
