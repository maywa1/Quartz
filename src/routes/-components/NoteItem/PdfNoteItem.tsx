import { useState, useRef, useEffect } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui'
import { Bookmark, MoreHorizontal } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import { formatDate } from '#/utils/formatDate'
import type { Tag } from '#/types/types'
import { useDeleteNote, useUpdateNote } from '#/hooks'
import { NoteItemMenu } from './NoteItemMenu'
import { useNoteItemMenu } from './hooks/UseNoteItemMenu'

interface PdfNoteItemProps {
  id: string
  name: string
  pdfId: string
  pdfPage?: number
  tags?: Tag[]
  createdAt?: string
  viewLater?: boolean
  className?: string
}

export function PdfNoteItem({
  id,
  name,
  pdfId,
  pdfPage,
  tags = [],
  createdAt,
  viewLater,
  className,
}: PdfNoteItemProps) {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  const menu = useNoteItemMenu(id, {
    contextWidth: 148,
    contextHeight: 140,
    tagsWidth: 148,
    tagsHeight: 140,
  })

  const deleteNote = useDeleteNote()
  const updateNote = useUpdateNote()

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  function startEdit() {
    setEditName(name)
    setIsEditing(true)
    menu.close()
  }

  function commitEdit() {
    if (editName.trim() && editName !== name) {
      updateNote.mutate({ id, updates: { name: editName.trim() } })
    }
    setIsEditing(false)
  }

  function handleRename() {
    startEdit()
  }

  function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return
    deleteNote.mutate(id)
    menu.close()
  }

  const displayTags = tags.slice(0, 5)
  const remainingCount = Math.max(0, tags.length - 5)

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={cn('q-pdf-note-item', className)}
        onClick={() =>
          navigate({
            to: '/workspace/$docId',
            params: { docId: pdfId },
            search: { noteId: id, initialPage: pdfPage },
          })
        }
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate({
              to: '/workspace/$docId',
              params: { docId: pdfId },
              search: { noteId: id, initialPage: pdfPage },
            })
          }
        }}
        onContextMenu={(e: MouseEvent) => {
          e.preventDefault()
          menu.openContext(e.clientX, e.clientY)
        }}
      >
        <div className="q-pdf-note-item__title-row">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === ' ') e.stopPropagation()
              }}
              className="q-note-item__edit-input"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="q-pdf-note-item__title">{name}</span>
          )}
          <div className="q-pdf-note-item__title-actions">
            {!!viewLater && (
              <span
                className="q-pdf-note-item__view-later"
                aria-label="Saved for later"
              >
                <Bookmark size={11} strokeWidth={2} />
              </span>
            )}
            <button
              className="q-note-item__menu-btn"
              aria-label="More options"
              onClick={(e) => {
                e.stopPropagation()
                const r = e.currentTarget.getBoundingClientRect()
                menu.openContext(r.left, r.bottom + 4)
              }}
            >
              <MoreHorizontal size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {(displayTags.length > 0 || createdAt) && (
          <div className="q-note-item__meta">
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

      {menu.isContextOpen && (
        <NoteItemMenu
          position={menu.position}
          menuRef={menu.menuRef as React.RefObject<HTMLDivElement>}
          onRename={handleRename}
          onManageTags={() => {}}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
