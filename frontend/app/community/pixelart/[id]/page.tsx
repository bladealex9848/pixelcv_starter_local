import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PixelartData {
  id: string
  title: string
  description: string | null
  author: string
  author_id: string
  pixels: { pixels: string[] }
  likes: number
  comments: number
  created_at: string
  prompt: string | null
  is_ai: boolean
}

/**
 * Genera metadata dinámica para cada pixelart.
 * Incluye Open Graph image generada dinámicamente.
 */
async function getPixelart(id: string): Promise<PixelartData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const res = await fetch(`${baseUrl}/pixelart/`, { cache: 'no-store' })
    if (!res.ok) return null

    const pixelarts: PixelartData[] = await res.json()
    return pixelarts.find(p => p.id === id) || null
  } catch {
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const pixelart = await getPixelart(id)

  if (!pixelart) {
    return {
      title: 'PixelArt no encontrado | PixelCV'
    }
  }

  const title = `${pixelart.title} - PixelArt de ${pixelart.author}`
  const description = pixelart.description || `PixelArt creado por ${pixelart.author}. ${pixelart.likes} likes, ${pixelart.comments} comentarios.`
  const ogImageUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelcv.alexanderoviedofadul.dev'}/api/og/pixelart/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelcv.alexanderoviedofadul.dev'}/community/pixelart/${id}`,
      siteName: 'PixelCV',
      type: 'article',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl]
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pixelcv.alexanderoviedofadul.dev'}/community/pixelart/${id}`
    }
  }
}

export default async function PixelartPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pixelart = await getPixelart(id)

  if (!pixelart) {
    notFound()
  }

  // Convertir pixels a URL de imagen (data URL)
  const canvas = typeof window === 'undefined' ? null : document.createElement('canvas')
  let dataUrl = ''

  if (canvas) {
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      pixelart.pixels.pixels.forEach((color, i) => {
        ctx.fillStyle = color
        ctx.fillRect(i % 32, Math.floor(i / 32), 1, 1)
      })
      dataUrl = canvas.toDataURL()
    }
  }

  return (
    <div className="min-h-screen bg-[#080505] text-white pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b-2 border-orange-900 pb-6">
          <h1 className="text-5xl font-black italic tracking-tighter text-orange-500 uppercase">
            {pixelart.title}
          </h1>
          <p className="text-gray-500 text-sm font-mono mt-2">
            Por: {pixelart.author} • {pixelart.likes} ❤️ • {pixelart.comments} 💬
          </p>
        </div>

        {/* PixelArt Preview */}
        <div className="flex justify-center">
          <div
            className="grid grid-cols-32 gap-0 border-4 border-orange-900 shadow-2xl"
            style={{
              gridTemplateColumns: 'repeat(32, 1fr)',
              width: '512px',
              aspectRatio: '1'
            }}
          >
            {pixelart.pixels.pixels.map((color, i) => (
              <div
                key={i}
                style={{ backgroundColor: color }}
                className="w-full h-full border-[0.1px] border-gray-200/10"
              />
            ))}
          </div>
        </div>

        {/* Info */}
        {pixelart.description && (
          <div className="bg-gray-900/50 p-6 border border-orange-900/30 rounded-lg">
            <h2 className="text-orange-400 text-xs font-bold uppercase mb-2">Descripción</h2>
            <p className="text-gray-300">{pixelart.description}</p>
          </div>
        )}

        {pixelart.is_ai && pixelart.prompt && (
          <div className="bg-purple-900/20 p-6 border border-purple-900/30 rounded-lg">
            <h2 className="text-purple-400 text-xs font-bold uppercase mb-2">🤖 Prompt de IA</h2>
            <p className="text-gray-300 font-mono text-sm">"{pixelart.prompt}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <a
            href="/community/pixelart"
            className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 uppercase text-sm transition-all"
          >
            ← Volver a Galería
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: pixelart.title,
                  text: `Mira este PixelArt de ${pixelart.author}`,
                  url: `${typeof window !== 'undefined' ? window.location.origin : ''}/community/pixelart/${id}`
                })
              }
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 uppercase text-sm transition-all"
          >
            Compartir
          </button>
        </div>
      </div>
    </div>
  )
}
