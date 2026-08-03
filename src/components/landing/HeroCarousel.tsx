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
 * Carrousel de modèles de CV, en profondeur.
 *
 * Toutes les feuilles occupent la même case ; c'est `transform` seul qui les
 * écarte, les incline et les réduit selon leur distance au centre — le
 * navigateur compose alors le mouvement sans refaire la mise en page, ce qui
 * garde le défilement fluide même avec huit modèles rendus en vrai.
 *
 * Une seule feuille est mise en avant : celle du centre est à taille pleine et
 * nette, les autres reculent, rapetissent et se brouillent par paliers.
 */

const DURATION = 650
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const TRANSITION = [
  `transform ${DURATION}ms ${EASE}`,
  `filter ${DURATION}ms ${EASE}`,
  `opacity ${DURATION}ms ${EASE}`,
].join(', ')

/** Nombre de feuilles visibles de chaque côté du centre. */
const VOISINES = 2

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

  /**
   * Écart signé de chaque feuille au centre, le plus court des deux sens :
   * c'est lui qui dicte la position, l'inclinaison et la taille.
   */
  const ecarts = useMemo(() => {
    const n = SLIDES.length
    return SLIDES.map((_, index) => {
      let d = index - activeIndex
      if (d > n / 2) d -= n
      if (d < -n / 2) d += n
      return d
    })
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

        {/* 2. Titre de la page. Il ne s'affiche plus en fond derrière les
            feuilles — la scène reste au CV — mais reste le seul titre de
            niveau 1, lu par les moteurs et les lecteurs d'écran. */}
        <h1 className="sr-only">
          IDJÔ CV — modèles de CV professionnels et lettre de motivation pour la Côte d’Ivoire et
          l’Afrique francophone
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
        <div
          className="absolute inset-0"
          style={{ zIndex: 3, perspective: 1800, perspectiveOrigin: '50% 55%' }}
        >
          {SLIDES.map((slide, index) => {
            const ecart = ecarts[index]
            const role = ecart === 0 ? 'center' : 'cote'
            const style = styleFeuille(ecart, isMobile, isTablet)
            return (
              <div
                key={slide.template.id}
                aria-hidden={Math.abs(ecart) > VOISINES}
                style={{
                  position: 'absolute',
                  aspectRatio: `${A4_WIDTH} / ${A4_HEIGHT}`,
                  transition: TRANSITION,
                  willChange: 'transform, filter, opacity',
                  transformStyle: 'preserve-3d',
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

        {/* 6. Navigation. Le nom du modèle et sa description ne s'affichent
            plus ici : la feuille du centre parle d'elle-même, et son nom reste
            porté par le titre du lien et le texte pour lecteurs d'écran. */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-16 sm:left-12 lg:left-20"
          style={{ zIndex: 60, maxWidth: 340 }}
        >
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

type StyleFeuille = {
  transform: string
  filter: string
  opacity: number
  zIndex: number
  left: string
  height: string
  bottom: string
  pointerEvents: 'auto' | 'none'
}

/**
 * Place une feuille selon son écart au centre.
 *
 * Toutes gardent la même case — même `left`, même `height`, même `bottom` — et
 * seul `transform` les déplace : le décalage latéral est exprimé en pourcentage
 * de leur propre largeur, donc il suit la taille de l'écran sans calcul.
 * L'inclinaison et le recul en Z creusent la profondeur ; l'échelle et le flou
 * font que la feuille du centre est la seule à s'imposer.
 *
 * Sous 1024 px, la scène remonte et rétrécit pour ne pas recouvrir le texte
 * posé en bas à gauche.
 */
function styleFeuille(ecart: number, isMobile: boolean, isTablet: boolean): StyleFeuille {
  const distance = Math.abs(ecart)
  const sens = Math.sign(ecart)
  const auCentre = distance === 0
  // Au-delà des voisines affichées, la feuille attend hors champ : elle garde
  // la même transition et revient donc en glissant, jamais en apparaissant.
  const cachee = distance > VOISINES
  const rang = Math.min(distance, VOISINES + 1)

  // Écart latéral, en part de la largeur de la feuille : les voisines se
  // resserrent à mesure qu'elles s'éloignent, ce qui évite un alignement plat.
  const pas = isMobile ? 52 : isTablet ? 62 : 70
  const decalage = sens * (pas * rang - 8 * Math.max(0, rang - 1))

  const echelle = auCentre ? 1 : Math.max(0.3, 1 - 0.32 * rang)
  const recul = -220 * rang
  const inclinaison = -sens * Math.min(22, 15 * rang)

  return {
    transform: [
      `translateX(calc(-50% + ${decalage}%))`,
      `translateZ(${recul}px)`,
      `rotateY(${inclinaison}deg)`,
      `scale(${echelle})`,
    ].join(' '),
    filter: auCentre ? 'none' : `blur(${Math.min(5, 2.2 * rang)}px)`,
    opacity: cachee ? 0 : auCentre ? 1 : Math.max(0.3, 0.82 - 0.3 * (rang - 1)),
    zIndex: 20 - rang,
    left: '50%',
    height: isMobile ? '52%' : isTablet ? '54%' : '62%',
    bottom: isMobile ? '25%' : isTablet ? '31%' : '26%',
    pointerEvents: cachee ? 'none' : 'auto',
  }
}
