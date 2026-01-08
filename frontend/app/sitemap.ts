import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pixelcv.alexanderoviedofadul.dev'
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Páginas estáticas
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7
    }
  ]

  // CVs públicos dinámicos
  try {
    const res = await fetch(`${apiUrl}/community/browse?limit=1000`, {
      next: { revalidate: 3600 }
    })
    const data = await res.json()

    const cvPages = data.cvs.map((cv: any) => ({
      url: `${baseUrl}/cv/${cv.slug}`,
      lastModified: new Date(cv.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6
    }))

    return [...staticPages, ...cvPages]
  } catch {
    return staticPages
  }
}
