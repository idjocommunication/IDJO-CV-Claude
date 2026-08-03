import { ButtonLink } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <section className="container-content flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-display text-7xl leading-none text-cloud-400 sm:text-8xl">404</p>
      <h1 className="title-lg mt-6 text-ink">Cette page n’existe pas</h1>
      <p className="prose-muted mt-4 max-w-md">
        Le lien est peut-être ancien. Reprenez depuis l’accueil ou ouvrez directement l’éditeur.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">
          Retour à l’accueil
        </ButtonLink>
        <ButtonLink href="/modeles" variant="outline" size="lg">
          Voir les modèles
        </ButtonLink>
      </div>
    </section>
  )
}
