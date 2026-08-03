'use client'

import { useState } from 'react'
import { Check, LayoutTemplate, Palette, X } from 'lucide-react'
import { MenuDeroulant, OptionMenu } from '@/components/ui/MenuDeroulant'
import { useCvStore } from '@/lib/store'
import { TEMPLATES } from '@/data/templates'
import {
  FONT_CHOICES,
  INTENSITIES,
  THEMES,
  THEME_BY_ID,
  resolveTheme,
  type IntensityDefinition,
} from '@/lib/theme'
import { isValidHex, shade, tint } from '@/lib/color'
import { cn } from '@/lib/utils'

const SCALES = [
  { value: 0.92, label: 'S' },
  { value: 1, label: 'M' },
  { value: 1.08, label: 'L' },
]

const FAMILIES: { id: (typeof THEMES)[number]['family']; label: string }[] = [
  { id: 'neutre', label: 'Neutres' },
  { id: 'froid', label: 'Froides' },
  { id: 'nature', label: 'Naturelles' },
  { id: 'chaud', label: 'Chaudes' },
]

/** Barre compacte affichée au-dessus de l'aperçu. */
export function DesignBar({ onOpenPanel }: { onOpenPanel: () => void }) {
  const settings = useCvStore((s) => s.data.settings)
  const theme = resolveTheme(settings)

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <TemplateMenu />

      <button
        type="button"
        onClick={onOpenPanel}
        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-cloud-400 bg-white py-1.5 pl-1.5 pr-3.5 text-[12px] font-semibold text-ink transition-colors hover:border-ink"
      >
        <span
          className="h-6 w-6 rounded-full ring-1 ring-black/10"
          style={{ background: theme.accent }}
          aria-hidden
        />
        <span className="whitespace-nowrap">Couleurs & design</span>
      </button>
    </div>
  )
}

/**
 * Choix du modèle en menu déroulant : huit pastilles occupaient toute la barre
 * et débordaient dès que l'aperçu se rétrécissait.
 */
function TemplateMenu() {
  const template = useCvStore((s) => s.data.settings.template)
  const setSettings = useCvStore((s) => s.setSettings)
  const actif = TEMPLATES.find((t) => t.id === template) ?? TEMPLATES[0]

  return (
    <MenuDeroulant
      label="Modèle"
      valeur={actif.name}
      vignette={<LayoutTemplate size={14} className="text-ink-muted" />}
    >
      {(fermer) =>
        TEMPLATES.map((item) => (
          <OptionMenu
            key={item.id}
            choisi={item.id === template}
            titre={item.name}
            detail={item.tagline}
            onClick={() => {
              setSettings({ template: item.id })
              fermer()
            }}
          />
        ))
      }
    </MenuDeroulant>
  )
}

/** Panneau latéral : palette, intensité, typographie, photo. */
export function DesignPanel({ onClose }: { onClose: () => void }) {
  const settings = useCvStore((s) => s.data.settings)
  const setSettings = useCvStore((s) => s.setSettings)
  const [custom, setCustom] = useState(settings.accent)

  const applyCustom = (value: string) => {
    setCustom(value)
    if (isValidHex(value)) setSettings({ theme: 'perso', accent: value })
  }

  return (
    <aside
      className="no-print absolute inset-y-0 right-0 z-30 flex w-full max-w-[380px] flex-col border-l border-cloud-300 bg-white shadow-float lg:static lg:shadow-none"
      aria-label="Couleurs et design du CV"
    >
      <header className="flex items-start justify-between gap-3 border-b border-cloud-300 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-bold text-ink">
            <Palette size={16} />
            Couleurs & design
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">
            Le contenu ne bouge pas : vous changez l’habillage autant de fois que vous voulez.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="-mr-1 -mt-1 rounded-full p-2 text-ink-muted transition-colors hover:bg-cloud-200 hover:text-ink"
          aria-label="Fermer le panneau de design"
        >
          <X size={16} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Palettes */}
        <section className="border-b border-cloud-200 px-5 py-5">
          <h3 className="eyebrow mb-4">Palette</h3>
          {FAMILIES.map((family) => (
            <div key={family.id} className="mb-4 last:mb-0">
              <p className="mb-2 text-[11px] font-medium text-neutral-400">{family.label}</p>
              <div className="flex flex-wrap gap-2">
                {THEMES.filter((theme) => theme.family === family.id).map((theme) => {
                  const active = settings.theme === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSettings({ theme: theme.id, accent: theme.accent })}
                      title={theme.name}
                      aria-label={`Palette ${theme.name}`}
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition-all',
                        active ? 'ring-2 ring-ink' : 'hover:scale-110',
                      )}
                      style={{ background: theme.accent }}
                    >
                      {active ? <Check size={14} className="text-white" strokeWidth={3} /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="mt-5 rounded-xl border border-cloud-300 p-4">
            <p className="text-[13px] font-semibold text-ink">Votre couleur</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Pour reprendre la teinte d’une entreprise ou d’une école.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="color"
                value={isValidHex(custom) ? custom : '#17284D'}
                onChange={(event) => applyCustom(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-cloud-400 bg-white p-1"
                aria-label="Choisir une couleur personnalisée"
              />
              <input
                type="text"
                value={custom}
                onChange={(event) => applyCustom(event.target.value)}
                placeholder="#17284D"
                className="field font-mono text-[13px] uppercase"
                aria-label="Code couleur hexadécimal"
              />
            </div>
            {settings.theme === 'perso' ? (
              <p className="mt-2 text-[11px] font-semibold text-ink">Couleur personnalisée active</p>
            ) : null}
          </div>
        </section>

        {/* Intensité */}
        <section className="border-b border-cloud-200 px-5 py-5">
          <h3 className="eyebrow mb-3">Dose de couleur</h3>
          <p className="mb-3 text-[11px] leading-relaxed text-ink-muted">
            De la couleur réservée aux traits jusqu’aux aplats pleins.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {INTENSITIES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSettings({ intensity: item.id })}
                title={item.hint}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                  settings.intensity === item.id
                    ? 'border-ink bg-cloud'
                    : 'border-cloud-300 hover:border-neutral-400',
                )}
              >
                <IntensityPreview
                  dose={item}
                  accent={THEME_BY_ID[settings.theme]?.accent ?? settings.accent}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">{item.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-ink-muted">
                    {item.hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Typographie */}
        <section className="border-b border-cloud-200 px-5 py-5">
          <h3 className="eyebrow mb-3">Typographie</h3>
          <div className="grid grid-cols-3 gap-2">
            {FONT_CHOICES.map((font) => (
              <button
                key={font.id}
                type="button"
                onClick={() => setSettings({ fontFamily: font.id })}
                className={cn(
                  'rounded-xl border px-2 py-3 text-center transition-colors',
                  settings.fontFamily === font.id
                    ? 'border-ink bg-cloud'
                    : 'border-cloud-300 hover:border-neutral-400',
                )}
              >
                <span className="block text-lg leading-none text-ink" style={{ fontFamily: font.css }}>
                  Ag
                </span>
                <span className="mt-2 block text-[12px] font-semibold text-ink">{font.label}</span>
                <span className="block text-[10px] text-ink-muted">{font.hint}</span>
              </button>
            ))}
          </div>

          <h3 className="eyebrow mb-3 mt-6">Taille du texte</h3>
          <div className="flex gap-2">
            {SCALES.map((scale) => (
              <button
                key={scale.label}
                type="button"
                onClick={() => setSettings({ fontScale: scale.value })}
                className={cn(
                  'h-10 flex-1 rounded-xl border text-[13px] font-bold transition-colors',
                  settings.fontScale === scale.value
                    ? 'border-ink bg-ink text-white'
                    : 'border-cloud-300 text-ink-muted hover:border-neutral-400 hover:text-ink',
                )}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </section>

        {/* Photo */}
        <section className="px-5 py-5">
          <h3 className="eyebrow mb-3">Photo</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSettings({ showPhoto: true })}
              className={cn(
                'h-10 flex-1 rounded-xl border text-[13px] font-semibold transition-colors',
                settings.showPhoto
                  ? 'border-ink bg-ink text-white'
                  : 'border-cloud-300 text-ink-muted hover:border-neutral-400 hover:text-ink',
              )}
            >
              Avec photo
            </button>
            <button
              type="button"
              onClick={() => setSettings({ showPhoto: false })}
              className={cn(
                'h-10 flex-1 rounded-xl border text-[13px] font-semibold transition-colors',
                !settings.showPhoto
                  ? 'border-ink bg-ink text-white'
                  : 'border-cloud-300 text-ink-muted hover:border-neutral-400 hover:text-ink',
              )}
            >
              Sans photo
            </button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
            La photo reste courante en Côte d’Ivoire. Retirez-la pour une candidature à
            l’international.
          </p>
        </section>
      </div>
    </aside>
  )
}

/**
 * Vignette illustrant la dose : elle se construit à partir des mêmes réglages
 * que la feuille, pour qu'une nouvelle dose n'ait rien à ajouter ici.
 */
function IntensityPreview({ dose, accent }: { dose: IntensityDefinition; accent: string }) {
  const teinte = isValidHex(accent) ? accent : '#17284D'
  const plein = dose.deepFlats ? shade(teinte, 22) : teinte
  const bandeau = dose.fill > 0 ? plein : '#D9D9D9'
  const bloc = dose.fill > 0 ? tint(teinte, dose.light[0], dose.chroma) : dose.neutral[0]

  return (
    <span
      className="flex h-11 w-8 shrink-0 flex-col overflow-hidden rounded-md bg-white ring-1 ring-black/10"
      aria-hidden
    >
      {/* Bandeau de tête : plein dès que la dose remplit les aplats. */}
      <span
        className="w-full"
        style={{ height: dose.fill >= 3 ? 14 : dose.fill === 2 ? 10 : 7, background: bandeau }}
      />
      {/* Filet coloré : présent à toutes les doses. */}
      <span className="mx-1 mt-1 h-0.5 w-3.5 rounded" style={{ background: teinte }} />
      {/* Bloc de contenu, teinté selon la dose. */}
      <span className="mx-1 mt-1 flex-1 rounded-sm" style={{ background: bloc }} />
    </span>
  )
}
