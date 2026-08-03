import { createRoot } from 'react-dom/client'
// @ts-expect-error — chargé en texte par esbuild (--loader:.txt=text)
import sourceWorkerPdf from './pdf-worker.txt'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import {
  FaqSection,
  Features,
  Pricing,
  StatsBar,
  Steps,
  TemplatesShowcase,
  Guarantees,
} from '@/components/landing/Sections'
import { EditorShell } from '@/components/editor/EditorShell'
import { LetterEditor } from '@/components/letter/LetterEditor'
import { Logo } from '@/components/site/Logo'
import { SectionNav, useActiveSection } from '@/components/site/SectionNav'

// pdf.js ira chercher son worker ici plutôt que sur un serveur.
;(globalThis as { __IDJO_PDF_WORKER__?: string }).__IDJO_PDF_WORKER__ = sourceWorkerPdf as string

/**
 * Démo autonome d'IDJÔ CV : les composants réels du site, compilés dans une
 * page unique et hébergée. Seule la navigation multi-pages est remplacée par
 * un défilement vers l'éditeur.
 */
function Demo() {
  const activeSection = useActiveSection(true)

  return (
    <div className="bg-white text-ink">
      <header className="sticky top-0 z-[70] border-b border-cloud-300 bg-white/90 backdrop-blur">
        <div className="container-content flex h-16 items-center justify-between gap-4">
          <Logo />
          <SectionNav onHome overHero={false} active={activeSection} className="hidden lg:flex" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-ink-muted xl:inline">Démo interactive</span>
            <a
              href="#demo-editeur"
              className="inline-flex h-10 items-center rounded-full bg-azur-btn px-5 text-sm font-semibold text-white transition-colors hover:brightness-110"
            >
              Essayer l’éditeur
            </a>
          </div>
        </div>
      </header>

      <div id="accueil">
        <HeroCarousel />
      </div>
      <StatsBar />

      <section id="demo-editeur" className="border-y border-cloud-300 bg-cloud">
        <div className="container-content py-14">
          <p className="eyebrow mb-3">L’éditeur</p>
          <h2 className="title-lg max-w-2xl">
            Remplissez, changez de modèle, téléchargez votre PDF
          </h2>
          <p className="prose-muted mt-4 max-w-2xl">
            Commencez par « Remplir avec l’exemple » pour voir la feuille se composer, puis
            modifiez ce que vous voulez. Le bouton « Télécharger le PDF » ouvre la boîte
            d’impression : choisissez « Enregistrer au format PDF ».
          </p>
        </div>
        <div className="demo-editor container-content pb-14">
          <div className="overflow-hidden rounded-2xl border border-cloud-400 bg-white shadow-float">
            <EditorShell />
          </div>
        </div>
      </section>

      <Features />

      <TemplatesShowcase />
      <section id="lettre" className="border-b border-cloud-300 bg-white">
        <div className="container-content py-14">
          <p className="eyebrow mb-3">La lettre de motivation</p>
          <h2 className="title-lg max-w-2xl">Une lettre assortie à votre CV</h2>
          <p className="prose-muted mt-4 max-w-2xl">
            Trois paragraphes guidés, la même palette que votre CV, et le même export PDF A4.
            L’assistant reprend votre CV pour proposer un premier jet.
          </p>
        </div>
        <div className="demo-editor container-content pb-14">
          <div className="overflow-hidden rounded-2xl border border-cloud-400 bg-white shadow-float">
            <LetterEditor />
          </div>
        </div>
      </section>

      <Steps />
      <Guarantees />
      <Pricing />
      <FaqSection />

      <footer className="bg-navy-900 py-12 text-white">
        <div className="container-content">
          <Logo inverted />
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/60">
            Aperçu de démonstration d’IDJÔ CV : les composants réels du site, compilés dans une
            page unique. Les données affichées sont celles d’un CV d’exemple.
          </p>
          <p className="mt-6 text-xs text-white/40">
            Plateforme de création de CV — Abidjan, Côte d’Ivoire.
          </p>
        </div>
      </footer>
    </div>
  )
}

const container = document.getElementById('idjo-root')
if (container) createRoot(container).render(<Demo />)
