import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CVClientWrapper from './CVClientWrapper'

// Función para obtener datos del CV
async function getCV(slug: string) {
  // En SSR usamos URL interna directa (localhost)
  // Esta función solo se ejecuta en el servidor (Server Component)
  const baseUrl = 'http://localhost:8000'
  const res = await fetch(`${baseUrl}/community/public/${slug}`, {
    cache: 'no-store'
  })

  if (!res.ok) return null
  return res.json()
}

// Generar metadata dinámica para cada CV
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cv = await getCV(slug)

  if (!cv) {
    return {
      title: 'CV no encontrado | PixelCV'
    }
  }

  const title = `${cv.name} - CV de ${cv.author.username}`
  const description = `CV profesional de ${cv.author.username}. ${cv.total_likes} likes, ${cv.total_visits} vistas. Ver CV completo en PixelCV.`
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelcv.alexanderoviedofadul.dev'}/cv/${cv.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      siteName: 'PixelCV',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `CV de ${cv.author.username}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png']
    },
    alternates: {
      canonical: url
    }
  }
}

// Server Component
export default async function PublicCVPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const cv = await getCV(slug)

  if (!cv) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#020a0a] text-white font-mono pt-16 pb-12 px-4 relative overflow-hidden">

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
        backgroundSize: '100% 2px'
      }}></div>

      {/* Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(20,184,166,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(20,184,166,0.3) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }}></div>

      {/* Floating Pixel Stars */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-teal-500 opacity-60 animate-twinkle"></div>
        <div className="absolute top-[25%] right-[15%] w-1 h-1 bg-cyan-400 opacity-40 animate-twinkle-delayed"></div>
        <div className="absolute top-[45%] left-[3%] w-2 h-2 bg-emerald-500 opacity-50 animate-twinkle"></div>
        <div className="absolute top-[65%] right-[95%] w-1 h-1 bg-teal-400 opacity-60 animate-twinkle-delayed"></div>
        <div className="absolute top-[80%] left-[8%] w-1 h-1 bg-cyan-400 opacity-50 animate-twinkle"></div>

        {/* Floating Icons */}
        <div className="absolute top-[20%] left-[5%] text-3xl opacity-15 animate-float-slow">📄</div>
        <div className="absolute top-[50%] right-[5%] text-2xl opacity-10 animate-float-medium">🏆</div>
        <div className="absolute top-[75%] left-[8%] text-2xl opacity-15 animate-float-delayed">⭐</div>
      </div>

      {/* Background Text */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="text-[12vw] font-black opacity-[0.015] tracking-widest text-teal-500 select-none">
          CV PREVIEW
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <CVClientWrapper cv={cv} slug={slug} />
      </div>
    </div>
  );
}
