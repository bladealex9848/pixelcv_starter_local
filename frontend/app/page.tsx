export default function Home() {
  return (
    <main className="p-10 space-y-6">
      <h1 className="text-4xl font-bold">PixelCV</h1>
      <p>Pulsa START para crear tu CV y renderizar en PDF con tipografía precisa.</p>
      <a href="/editor" className="btn-start">START: Crear CV</a>
    </main>
  )
}
