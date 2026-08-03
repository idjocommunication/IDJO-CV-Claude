import type { Metadata, Viewport } from 'next'
import {
  Anton,
  Archivo_Narrow,
  IBM_Plex_Sans,
  Inter,
  Lora,
  Montserrat,
  Playfair_Display,
  Poppins,
  Source_Serif_4,
  Work_Sans,
} from 'next/font/google'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { JsonLd, SITE, organizationJsonLd, softwareJsonLd } from '@/lib/seo'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800'],
})

const lora = Lora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
})

const archivo = Archivo_Narrow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['400', '500', '600', '700'],
})

const anton = Anton({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-anton',
  weight: '400',
})

/* Familles proposées dans le panneau « Couleurs & design » du CV et de la
   lettre. Chacune couvre le gras 700/800 dont les modèles ont besoin pour les
   titres de section. */

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '800'],
})

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
})

const workSans = Work_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-work-sans',
  weight: ['400', '500', '600', '700', '800'],
})

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plex',
  weight: ['400', '500', '600', '700'],
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif',
  weight: ['400', '600', '700'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800'],
})

const FONT_VARIABLES = [
  inter,
  anton,
  lora,
  archivo,
  montserrat,
  poppins,
  workSans,
  plex,
  sourceSerif,
  playfair,
]
  .map((font) => font.variable)
  .join(' ')

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: 'IDJÔ CV — Créez un CV professionnel en 10 minutes',
    template: '%s | IDJÔ CV',
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  publisher: SITE.name,
  formatDetection: { telephone: true, email: true, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: 'IDJÔ CV — Créez un CV professionnel en 10 minutes',
    description: SITE.description,
  },
  category: 'business',
}

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={FONT_VARIABLES}>
      <body className="flex min-h-screen flex-col bg-white font-sans">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={softwareJsonLd()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
