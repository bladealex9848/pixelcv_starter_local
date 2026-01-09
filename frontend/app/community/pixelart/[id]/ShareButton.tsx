'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  author: string
  id: string
}

type ToastType = 'success' | 'info' | 'error' | null

export default function ShareButton({ title, author, id }: ShareButtonProps) {
  const [toast, setToast] = useState<{ message: string; type: ToastType }>({ message: '', type: null })
  const [isAnimating, setIsAnimating] = useState(false)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: null }), 3000)
  }

  const handleShare = async () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    const shareUrl = `${window.location.origin}/community/pixelart/${id}`
    const shareText = `Mira este PixelArt "${title}" de ${author}`

    // Intentar usar Web Share API (móviles y algunos navegadores)
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: shareUrl
        })
        showToast('¡Compartido exitosamente! 🎮', 'success')
      } catch (err) {
        // Usuario canceló o error
        if ((err as Error).name !== 'AbortError') {
          // Fallback: copiar al portapapeles
          await copyToClipboard(shareUrl)
        }
      }
    } else {
      // Fallback: copiar al portapapeles
      await copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showToast('¡Link copiado al portapapeles! 📋', 'success')
    } catch {
      // Fallback final: seleccionar texto
      showToast('No se pudo copiar. Copia manualmente la URL.', 'error')
    }
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast.type && (
        <div
          className={`
            absolute -top-16 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-sm text-sm font-mono whitespace-nowrap
            animate-fade-in-up shadow-lg border-2
            ${toast.type === 'success'
              ? 'bg-green-900/90 text-green-300 border-green-500'
              : toast.type === 'error'
              ? 'bg-red-900/90 text-red-300 border-red-500'
              : 'bg-purple-900/90 text-purple-300 border-purple-500'
            }
          `}
        >
          <span className="inline-block mr-1">›</span>
          {toast.message}
        </div>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className={`
          bg-purple-600 hover:bg-purple-500 text-white font-bold
          px-6 py-3 uppercase text-sm transition-all
          border-b-4 border-purple-800 hover:border-purple-700
          active:border-b-0 active:mt-1
          ${isAnimating ? 'scale-95' : 'scale-100'}
        `}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Compartir
        </span>
      </button>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
