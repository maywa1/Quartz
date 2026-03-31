import type { KeyboardEvent } from 'react'
import { useMemo } from 'react'
import { cn } from '#/components/ui/cn'
import { Badge } from '#/components/ui'
import type { Tag } from '#/types/types'
import './NoteItem.css'

export interface NoteItemProps {
  name: string
  tags?: Tag[]
  createdAt?: string
  pdfName?: string
  active?: boolean
  onClick?: () => void
  className?: string
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NoteItem({
  name,
  tags = [],
  createdAt,
  pdfName,
  active = false,
  onClick,
  className,
}: NoteItemProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const displayTags = useMemo(() => tags.slice(0, 3), [tags])
  const remainingCount = tags.length - 3

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? 'page' : undefined}
      className={cn('q-note-item', active && 'q-note-item--active', className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="q-note-item__title">{name}</span>
      {(displayTags.length > 0 || createdAt || pdfName) && (
        <div className="q-note-item__meta">
          {pdfName && (
            <Badge variant="outline" className="q-note-item__pdf">
              {pdfName}
            </Badge>
          )}
          {displayTags.map((tag) => (
            <Badge key={tag.id} variant="green" className="q-note-item__tag">
              {tag.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="muted" className="q-note-item__tag">
              +{remainingCount}
            </Badge>
          )}
          {createdAt && (
            <span className="q-note-item__date">{formatDate(createdAt)}</span>
          )}
        </div>
      )}
    </div>
  )
}
