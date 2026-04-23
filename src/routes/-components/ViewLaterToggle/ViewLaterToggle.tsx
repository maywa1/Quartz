import { Bookmark } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import './ViewLaterToggle.css'

export interface ViewLaterToggleProps {
  active: boolean
  onToggle: (active: boolean) => void
  className?: string
}

export function ViewLaterToggle({
  active,
  onToggle,
  className,
}: ViewLaterToggleProps) {
  function handleClick() {
    onToggle(!active)
  }

  return (
    <button
      type="button"
      className={cn(
        'q-view-later-toggle',
        active && 'q-view-later-toggle--active',
        className,
      )}
      onClick={handleClick}
      aria-pressed={active}
      aria-label="Filter by saved for later"
    >
      <Bookmark
        size={14}
        strokeWidth={1.75}
        className="q-view-later-toggle__icon"
      />
      <span className="q-view-later-toggle__label">Saved</span>
    </button>
  )
}
