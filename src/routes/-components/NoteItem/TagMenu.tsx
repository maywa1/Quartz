import { useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import type { Tag } from '#/types/types'

interface TagMenuProps {
  position: { x: number; y: number }
  allTags: Tag[]
  selectedTagIds: Set<string>
  newTagName: string
  onNewTagNameChange: (value: string) => void
  onToggleTag: (tag: Tag) => void
  onCreateTag: () => void
  onClose: () => void
}

export function TagMenu({
  position,
  allTags,
  selectedTagIds,
  newTagName,
  onNewTagNameChange,
  onToggleTag,
  onCreateTag,
  onClose,
}: TagMenuProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className="q-note-item__menu q-note-item__tag-menu"
      style={{ left: position.x, top: position.y }}
      role="dialog"
      aria-label="Manage tags"
    >
      <div className="q-note-item__tag-menu-header">
        <span className="q-note-item__tag-menu-title">Tags</span>
        <button
          className="q-note-item__tag-menu-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      <div className="q-note-item__tag-list">
        {allTags.length === 0 && (
          <p className="q-note-item__tag-empty">No tags yet</p>
        )}
        {allTags.map((tag) => (
          <button
            key={tag.id}
            className={cn(
              'q-note-item__tag-option',
              selectedTagIds.has(tag.id) && 'q-note-item__tag-option--selected',
            )}
            onClick={() => onToggleTag(tag)}
          >
            <span className="q-note-item__tag-check">
              {selectedTagIds.has(tag.id) && '✓'}
            </span>
            {tag.name}
          </button>
        ))}
      </div>

      <div className="q-note-item__tag-create">
        <input
          ref={inputRef}
          type="text"
          placeholder="New tag…"
          value={newTagName}
          onChange={(e) => onNewTagNameChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreateTag()}
          className="q-note-item__tag-input"
          aria-label="New tag name"
        />
        <button
          className="q-note-item__tag-add-btn"
          onClick={onCreateTag}
          disabled={!newTagName.trim()}
          aria-label="Add tag"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
