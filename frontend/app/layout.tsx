import './styles/globals.css'
export const metadata = { title: 'PixelCV', description: 'Genera CVs con RenderCV' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
