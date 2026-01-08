import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PixelartData {
  id: string
  title: string
  author: string
  pixels: { pixels: string[] }
}

/**
 * API Route para generar imágenes Open Graph de PixelArt.
 *
 * Esta ruta hace proxy al backend Python que genera las imágenes OG
 * utilizando Pillow para mejor calidad y rendimiento.
 *
 * GET /api/og/pixelart/[id]
 *
 * Returns: PNG image (1200x630px)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    // Obtener imagen OG del backend Python
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const ogResponse = await fetch(`${backendUrl}/pixelart/${id}/og`, {
      next: { revalidate: 3600 } // Cache por 1 hora
    })

    if (!ogResponse.ok) {
      // Si el pixelart no existe, retornar imagen OG por defecto
      return new NextResponse(
        JSON.stringify({ error: 'PixelArt no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Obtener la imagen como ArrayBuffer
    const imageBuffer = await ogResponse.arrayBuffer()

    // Retornar la imagen con headers de caché
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Disposition': `inline; filename=pixelart-${id}-og.png`
      }
    })
  } catch (error) {
    console.error('[OG Image] Error generando imagen OG:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Error generando imagen OG' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
