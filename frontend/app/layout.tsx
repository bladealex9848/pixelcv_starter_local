import '../styles/globals.css'
import Navbar from '../components/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://pixelcv.alexanderoviedofadul.dev'),
  // Básicos
  title: {
    default: 'PixelCV - Crea CVs Profesionales con IA y Gamificación',
    template: '%s | PixelCV'
  },
  description: 'Plataforma para crear CVs profesionales con IA, RenderCV y gamificación. Comparte tus CVs, sube de nivel y únete a la comunidad.',
  keywords: ['CV', 'resume', 'portfolio', 'IA', 'RenderCV', 'gamification', 'plantillas CV', 'curriculum'],
  authors: [{ name: 'PixelCV Team' }],
  creator: 'PixelCV',
  publisher: 'PixelCV',

  // Open Graph / Facebook / LinkedIn / WhatsApp
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://pixelcv.alexanderoviedofadul.dev',
    title: 'PixelCV - Crea CVs Profesionales con IA',
    description: 'Crea CVs profesionales con IA, comparte con la comunidad y sube de nivel. Sistema de gamificación incluido.',
    siteName: 'PixelCV',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PixelCV - Plataforma de CVs con IA'
      }
    ]
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'PixelCV - Crea CVs Profesionales con IA',
    description: 'Crea CVs profesionales con IA, comparte con la comunidad y sube de nivel.',
    images: ['/og-image.png'],
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },

  // Manifest
  manifest: '/site.webmanifest',

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },

  // Canonical URLs para multi-dominio
  alternates: {
    canonical: 'https://pixelcv.alexanderoviedofadul.dev'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'PixelCV',
              description: 'Plataforma para crear CVs profesionales con IA y gamificación',
              url: 'https://pixelcv.alexanderoviedofadul.dev',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
              },
              author: {
                '@type': 'Organization',
                name: 'PixelCV Team'
              }
            })
          }}
        />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
