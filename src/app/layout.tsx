import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { JsonLd, SITE, organizationJsonLd, softwareJsonLd } from '@/lib/seo'
import './globals.css'

/* Polices servies depuis le dépôt (`src/app/polices/`, voir
   `scripts/telecharger-polices.mjs`) et non plus téléchargées chez Google à
   chaque construction : Google Fonts répond par intermittence aux serveurs
   Hostinger avec des adresses que Next.js ne sait pas lire, et la construction
   échouait. Les familles variables tiennent en un fichier pour toutes leurs
   graisses. */

const inter = localFont({
  src: [{ path: './polices/inter-400-800.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  variable: '--font-inter',
})

const lora = localFont({
  src: [{ path: './polices/lora-400-700.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-lora',
  adjustFontFallback: 'Times New Roman',
})

const archivo = localFont({
  src: [{ path: './polices/archivo-narrow-400-700.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-archivo',
})

const anton = localFont({
  src: [{ path: './polices/anton-400.woff2', weight: '400', style: 'normal' }],
  display: 'swap',
  variable: '--font-anton',
})

/* Familles proposées dans le panneau « Couleurs & design » du CV et de la
   lettre. Chacune couvre le gras 700/800 dont les modèles ont besoin pour les
   titres de section. */

const montserrat = localFont({
  src: [{ path: './polices/montserrat-400-800.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  variable: '--font-montserrat',
})

const poppins = localFont({
  src: [
    { path: './polices/poppins-400.woff2', weight: '400', style: 'normal' },
    { path: './polices/poppins-500.woff2', weight: '500', style: 'normal' },
    { path: './polices/poppins-600.woff2', weight: '600', style: 'normal' },
    { path: './polices/poppins-700.woff2', weight: '700', style: 'normal' },
    { path: './polices/poppins-800.woff2', weight: '800', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-poppins',
})

const workSans = localFont({
  src: [{ path: './polices/work-sans-400-800.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  variable: '--font-work-sans',
})

const plex = localFont({
  src: [{ path: './polices/ibm-plex-sans-400-700.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-plex',
})

const sourceSerif = localFont({
  src: [{ path: './polices/source-serif-4-400-700.woff2', weight: '400 700', style: 'normal' }],
  display: 'swap',
  variable: '--font-source-serif',
  adjustFontFallback: 'Times New Roman',
})

const playfair = localFont({
  src: [{ path: './polices/playfair-display-400-800.woff2', weight: '400 800', style: 'normal' }],
  display: 'swap',
  variable: '--font-playfair',
  adjustFontFallback: 'Times New Roman',
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
