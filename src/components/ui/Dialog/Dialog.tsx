import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 bg-(--q-bg) border border-(--q-border) rounded-lg shadow-2xl overflow-hidden"
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--q-border)">
            <h2 className="text-lg font-semibold text-(--q-text)">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale) rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
