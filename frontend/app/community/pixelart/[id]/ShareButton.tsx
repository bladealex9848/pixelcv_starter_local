'use client'

interface ShareButtonProps {
  title: string
  author: string
  id: string
}

export default function ShareButton({ title, author, id }: ShareButtonProps) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `Mira este PixelArt de ${author}`,
        url: `${window.location.origin}/community/pixelart/${id}`
      })
    }
  }

  return (
    <button
      onClick={handleShare}
      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 uppercase text-sm transition-all"
    >
      Compartir
    </button>
  )
}
