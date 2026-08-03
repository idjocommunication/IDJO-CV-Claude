import type { Metadata } from 'next'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { ContactForm } from '@/components/site/ContactForm'
import { SITE, buildMetadata, whatsappLink } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: 'Contact',
  description:
    'Une question sur votre CV, un besoin d’accompagnement ou un problème technique ? L’équipe IDJÔ CV répond sous 24 heures.',
  path: '/contact',
})

export default function ContactPage() {
  const whatsapp = whatsappLink('Bonjour, je vous écris depuis IDJÔ CV.')

  return (
    <section className="container-content py-16 sm:py-24">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="eyebrow mb-3">Contact</p>
          <h1 className="title-xl text-ink">Parlons de votre candidature</h1>
          <p className="prose-muted mt-5">
            Support technique, question sur une offre, demande d’accompagnement par un consultant
            RH : écrivez-nous, on répond en français sous 24 heures ouvrées.
          </p>

          <ul className="mt-10 space-y-5">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cloud-200 text-ink">
                <Mail size={16} />
              </span>
              <span>
                <span className="block text-sm font-bold text-ink">Email</span>
                <a href={`mailto:${SITE.email}`} className="text-sm text-ink-muted hover:text-ink">
                  {SITE.email}
                </a>
              </span>
            </li>
            {SITE.phone ? (
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cloud-200 text-ink">
                  <Phone size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">Téléphone</span>
                  <a
                    href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    {SITE.phone}
                  </a>
                </span>
              </li>
            ) : null}
            {whatsapp ? (
              <li className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cloud-200 text-ink">
                  <MessageCircle size={16} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-ink">WhatsApp</span>
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-ink-muted hover:text-ink"
                  >
                    Discuter maintenant
                  </a>
                </span>
              </li>
            ) : null}
          </ul>
        </div>

        <ContactForm />
      </div>
    </section>
  )
}
