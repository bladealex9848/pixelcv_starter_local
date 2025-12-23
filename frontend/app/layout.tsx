import '../styles/globals.css'
import Navbar from '../components/Navbar'

export const metadata = { title: 'PixelCV', description: 'Genera CVs con RenderCV' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
