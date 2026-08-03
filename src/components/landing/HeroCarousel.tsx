'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { A4_HEIGHT, A4_WIDTH } from '@/cv-templates'
import { AutoScaleSheet } from '@/components/ui/AutoScaleSheet'
import { SAMPLE_CV } from '@/data/sample-cv'
import { TEMPLATES } from '@/data/templates'
import type { CvData } from '@/lib/types'

/**
 * Carrousel de modèles de CV — même chorégraphie que la référence
 * (rôles centre / gauche / droite / arrière, transitions 650 ms
 * cubic-bezier(0.4, 0, 0.2, 1)), avec des feuilles A4 à la place des figurines
 * et la charte monochrome blanc / noir / gris.
 */

const DURATION = 650
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const TRANSITION = [
  `transform ${DURATION}ms ${EASE}`,
  `filter ${DURATION}ms ${EASE}`,
  `opacity ${DURATION}ms ${EASE}`,
  `left ${DURATION}ms ${EASE}`,
  `height ${DURATION}ms ${EASE}`,
  `bottom ${DURATION}ms ${EASE}`,
].join(', ')

const SLIDES = TEMPLATES.map((template) => ({
  template,
  data: {
    ...SAMPLE_CV,
    settings: {
      ...SAMPLE_CV.settings,
      template: template.id,
      theme: template.defaultTheme,
    },
  } as CvData,
}))

type Role = 'center' | 'left' | 'right' | 'back'

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  // Seule la feuille du centre part dans le HTML initial : les trois autres,
  // floutées à l'arrière-plan, se composent après le premier rendu.
  const [decorsPrets, setDecorsPrets] = useState(false)
  const isAnimating = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 640)
      setIsTablet(window.innerWidth < 1024)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const navigate = useCallback((direction: 'next' | 'prev') => {
    if (isAnimating.current) return
    isAnimating.current = true
    setActiveIndex((prev) =>
      direction === 'next' ? (prev + 1) % SLIDES.length : (prev + SLIDES.length - 1) % SLIDES.length,
    )
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      isAnimating.current = false
    }, DURATION)
  }, [])

  useEffect(() => setDecorsPrets(true), [])

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  // Défilement automatique, suspendu dès la première interaction manuelle.
  const [autoplay, setAutoplay] = useState(true)
  useEffect(() => {
    if (!autoplay) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const id = setInterval(() => navigate('next'), 4200)
    return () => clearInterval(id)
  }, [autoplay, navigate])

  const onNav = (direction: 'next' | 'prev') => {
    setAutoplay(false)
    navigate(direction)
  }

  /** Clic sur une feuille de côté : elle passe au centre. */
  const focusSlide = useCallback((index: number) => {
    setAutoplay(false)
    setActiveIndex(index)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') onNav('next')
      if (event.key === 'ArrowLeft') onNav('prev')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const roles = useMemo<Record<number, Role>>(() => {
    const n = SLIDES.length
    return {
      [activeIndex]: 'center',
      [(activeIndex + n - 1) % n]: 'left',
      [(activeIndex + 1) % n]: 'right',
      [(activeIndex + 2) % n]: 'back',
    }
  }, [activeIndex])

  const active = SLIDES[activeIndex]

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: active.template.stage.bg,
        transition: `background-color ${DURATION}ms ${EASE}`,
      }}
    >
      <div
        className="relative w-full"
        style={{
          height: 'min(100dvh, 940px)',
          minHeight: 620,
          overflow: 'hidden',
        }}
      >
        {/* 1. Grain */}
        <div
          className="grain pointer-events-none absolute inset-0"
          style={{ zIndex: 50, opacity: 0.4 }}
          aria-hidden
        />

        {/* 2. Titre fantôme — c'est aussi le seul titre de niveau 1 de la page. */}
        <h1
          className="pointer-events-none absolute inset-x-0 flex select-none items-center justify-center"
          style={{ zIndex: 2, top: '17%' }}
        >
          <span
            aria-hidden
            className="font-display"
            style={{
              fontSize: 'clamp(72px, 22vw, 320px)',
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            IDJÔ CV
          </span>
          <span className="sr-only">
            IDJÔ CV — modèles de CV professionnels et lettre de motivation pour la Côte d’Ivoire et
            l’Afrique francophone
          </span>
        </h1>

        {/* 3. Marque */}
        <div
          className="absolute left-4 top-24 sm:left-8"
          style={{ zIndex: 60 }}
        >
          <span
            className="text-xs font-semibold uppercase text-white"
            style={{ opacity: 0.9, letterSpacing: '0.18em' }}
          >
            Modèles IDJÔ CV
          </span>
        </div>

        {/* 4. Panneau de scène — teinte secondaire de la référence */}
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-t-[999px]"
          style={{
            zIndex: 1,
            bottom: 0,
            width: 'min(64vw, 660px)',
            height: '74%',
            backgroundColor: active.template.stage.panel,
            transition: `background-color ${DURATION}ms ${EASE}`,
          }}
        />

        {/* 5. Carrousel */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {SLIDES.map((slide, index) => {
            const role = roles[index] ?? 'back'
            const style = roleStyle(role, isMobile, isTablet)
            return (
              <div
                key={slide.template.id}
                style={{
                  position: 'absolute',
                  aspectRatio: `${A4_WIDTH} / ${A4_HEIGHT}`,
                  transition: TRANSITION,
                  willChange: 'transform, filter, opacity',
                  ...style,
                }}
              >
                {role === 'center' ? (
                  <Link
                    href={`/editeur?modele=${slide.template.id}`}
                    className="block h-full w-full rounded-[3px] focus-visible:ring-offset-0"
                    title={`Créer mon CV avec le modèle ${slide.template.name}`}
                  >
                    <SheetThumb data={slide.data} highlight />
                    <span className="sr-only">
                      Créer mon CV avec le modèle {slide.template.name}
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => focusSlide(index)}
                    className="block h-full w-full cursor-pointer rounded-[3px]"
                    title={`Voir le modèle ${slide.template.name}`}
                  >
                    {decorsPrets ? (
                      <SheetThumb data={slide.data} highlight={false} />
                    ) : (
                      <span className="block h-full w-full rounded-[3px] bg-white/90" />
                    )}
                    <span className="sr-only">Voir le modèle {slide.template.name}</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 6. Texte + navigation */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-16 sm:left-12 lg:left-20"
          style={{ zIndex: 60, maxWidth: 340 }}
        >
          <p
            className="mb-2 text-base font-bold uppercase tracking-widest text-white sm:mb-3 sm:text-[22px]"
            style={{ letterSpacing: '0.02em' }}
          >
            Modèle {active.template.name}
          </p>
          <p
            className="mb-4 hidden text-xs text-white lg:mb-5 lg:block lg:text-sm"
            style={{ lineHeight: 1.6, opacity: 0.85 }}
          >
            {active.template.description}
          </p>
          <p className="mb-4 text-[11px] uppercase tracking-[0.16em] text-white/70 sm:mb-5">
            Cliquez sur un modèle pour l’ouvrir
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onNav('prev')}
              aria-label="Modèle précédent"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-white/[.12] sm:h-16 sm:w-16"
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              type="button"
              onClick={() => onNav('next')}
              aria-label="Modèle suivant"
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-[transform,background-color] duration-150 hover:scale-[1.08] hover:bg-white/[.12] sm:h-16 sm:w-16"
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 7. Lien */}
        <div className="absolute bottom-6 right-4 sm:bottom-16 sm:right-10" style={{ zIndex: 60 }}>
          <Link
            href={`/editeur?modele=${active.template.id}`}
            className="flex items-center gap-2 font-display uppercase text-white no-underline opacity-95 transition-opacity duration-200 hover:opacity-100"
            style={{
              fontSize: 'clamp(20px, 4vw, 56px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Créer mon CV
            <ArrowRight className="h-5 w-5 sm:h-8 sm:w-8" strokeWidth={2.25} />
          </Link>
        </div>

        {/* Pagination discrète */}
        <div
          className="absolute right-4 top-24 flex gap-2 sm:right-10"
          style={{ zIndex: 60 }}
          aria-hidden
        >
          {SLIDES.map((slide, index) => (
            <span
              key={slide.template.id}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: index === activeIndex ? 26 : 8,
                background: index === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,.4)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Feuille A4 réduite : rendu réel du modèle, mis à l'échelle automatiquement. */
function SheetThumb({ data, highlight }: { data: CvData; highlight: boolean }) {
  return (
    <div
      className="h-full w-full overflow-hidden rounded-[3px] bg-white"
      style={{
        boxShadow: highlight
          ? '0 40px 80px -30px rgba(10,10,10,.45)'
          : '0 20px 40px -24px rgba(10,10,10,.35)',
      }}
    >
      <AutoScaleSheet data={data} rounded={3} />
    </div>
  )
}

type RoleStyle = {
  transform: string
  filter: string
  opacity: number
  zIndex: number
  left: string
  height: string
  bottom: string
}

/**
 * Positions des feuilles. Sous 1024 px, la feuille centrale remonte et rétrécit
 * pour ne pas recouvrir le texte posé en bas à gauche.
 */
function roleStyle(role: Role, isMobile: boolean, isTablet: boolean): RoleStyle {
  switch (role) {
    case 'center':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'none',
        opacity: 1,
        zIndex: 20,
        left: '50%',
        height: isMobile ? '52%' : isTablet ? '54%' : '62%',
        bottom: isMobile ? '25%' : isTablet ? '31%' : '26%',
      }
    case 'left':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '10%' : '20%',
        height: isMobile ? '28%' : isTablet ? '32%' : '40%',
        bottom: isMobile ? '37%' : isTablet ? '42%' : '37%',
      }
    case 'right':
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(2px)',
        opacity: 0.85,
        zIndex: 10,
        left: isMobile ? '90%' : '80%',
        height: isMobile ? '28%' : isTablet ? '32%' : '40%',
        bottom: isMobile ? '37%' : isTablet ? '42%' : '37%',
      }
    case 'back':
    default:
      return {
        transform: 'translateX(-50%) scale(1)',
        filter: 'blur(4px)',
        opacity: 1,
        zIndex: 5,
        left: '50%',
        height: isMobile ? '24%' : isTablet ? '26%' : '32%',
        bottom: isMobile ? '39%' : isTablet ? '45%' : '41%',
      }
  }
}
