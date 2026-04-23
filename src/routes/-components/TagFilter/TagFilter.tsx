import { useState, useRef, useEffect } from 'react'
import { Tag, X } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import type { Tag as TagType } from '#/types/types'
import './TagFilter.css'

export interface TagFilterProps {
  allTags: TagType[]
  selectedTagIds: string[]
  onToggleTag: (tagId: string) => void
  className?: string
}

export function TagFilter({
  allTags,
  selectedTagIds,
  onToggleTag,
  className,
}: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  function handleToggle(tag: TagType) {
    onToggleTag(tag.id)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    selectedTagIds.forEach((id) => onToggleTag(id))
  }

  function handleToggleDropdown() {
    setIsOpen((v) => !v)
  }

  if (allTags.length === 0) return null

  return (
    <div ref={containerRef} className={cn('q-tag-filter', className)}>
      <button
        type="button"
        className={cn(
          'q-tag-filter__trigger',
          isOpen && 'q-tag-filter__trigger--open',
          selectedTagIds.length > 0 && 'q-tag-filter__trigger--active',
        )}
        onClick={handleToggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Tag size={14} strokeWidth={1.75} className="q-tag-filter__icon" />
        <span className="q-tag-filter__label">
          {selectedTagIds.length > 0
            ? selectedTagIds.length === 1
              ? allTags.find((t) => t.id === selectedTagIds[0])?.name
              : `${selectedTagIds.length} tags`
            : 'Filter by tag'}
        </span>
        {selectedTagIds.length > 0 ? (
          <button
            type="button"
            className="q-tag-filter__clear"
            onClick={handleClear}
            aria-label="Clear filter"
          >
            <X size={12} strokeWidth={2} />
          </button>
        ) : (
          <span className="q-tag-filter__chevron">▼</span>
        )}
      </button>

      {isOpen && (
        <div className="q-tag-filter__dropdown" role="listbox">
          {selectedTagIds.length > 0 && (
            <button
              type="button"
              className="q-tag-filter__option q-tag-filter__option--clear"
              onClick={() => {
                selectedTagIds.forEach((id) => onToggleTag(id))
                setIsOpen(false)
              }}
              role="option"
            >
              Clear all
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={cn(
                'q-tag-filter__option',
                selectedTagIds.includes(tag.id) &&
                  'q-tag-filter__option--selected',
              )}
              onClick={() => handleToggle(tag)}
              role="option"
              aria-selected={selectedTagIds.includes(tag.id)}
            >
              {selectedTagIds.includes(tag.id) && (
                <span className="q-tag-filter__check">✓</span>
              )}
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
