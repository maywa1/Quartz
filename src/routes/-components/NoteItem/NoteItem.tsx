import { useMemo, type KeyboardEvent, type MouseEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  MoreHorizontal,
  FileText,
  ChevronDown,
  ChevronRight,
  Bookmark,
} from 'lucide-react'
import { cn } from '#/components/ui/cn'
import { Badge } from '#/components/ui'
import {
  useDeleteNote,
  useDeletePdf,
  useNotesByPdf,
  useAllNoteTags,
} from '#/hooks'
import { FileStorage } from '#/lib/FileStorage'
import { formatDate } from '#/utils/formatDate'
import type { Tag } from '#/types/types'
import { NoteItemMenu } from './NoteItemMenu'
import { TagMenu } from './TagMenu'
import { PdfNoteItem } from './PdfNoteItem'
import { useNoteItemMenu } from './hooks/UseNoteItemMenu'
import { useNoteItemEdit } from './hooks/useNoteItemEdit'
import { useNoteItemTags } from './hooks/UseNoteItemTags'
import { useState } from 'react'
import './NoteItem.css'

export interface NoteItemProps {
  id: string
  name: string
  tags?: Tag[]
  createdAt?: string
  pdfName?: string
  viewLater?: boolean
  active?: boolean
  onClick?: () => void
  className?: string
}

export function NoteItem({
  id,
  name,
  tags = [],
  createdAt,
  pdfName,
  viewLater = false,
  active = false,
  onClick,
  className,
}: NoteItemProps) {
  const navigate = useNavigate()
  const isPdf = !!pdfName

  const [expanded, setExpanded] = useState(false)

  const menu = useNoteItemMenu()
  const edit = useNoteItemEdit({ id, name, isPdf })
  const tagOps = useNoteItemTags({ id, tags, isPdf })

  const deleteNote = useDeleteNote()
  const deletePdf = useDeletePdf()

  const { data: pdfNotes = [] } = useNotesByPdf(isPdf ? id : '')
  const { data: pdfNoteTagsMap = new Map() } = useAllNoteTags()

  const displayTags = useMemo(() => tags.slice(0, 10), [tags])
  const remainingCount = Math.max(0, tags.length - 10)

  function handleClick() {
    if (isPdf) {
      navigate({
        to: '/workspace/$docId',
        params: { docId: id },
        search: { initialPage: undefined, noteId: undefined },
      })
      return
    }
    onClick
      ? onClick()
      : navigate({
          to: '/workspace/$docId',
          params: { docId: id },
          search: { initialPage: undefined, noteId: undefined },
        })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    menu.openContext(e.clientX, e.clientY)
  }

  function handleMenuButtonClick(e: React.MouseEvent) {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    menu.openContext(r.left, r.bottom + 4)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      if (isPdf) {
        await FileStorage.deleteDir(id)
        await deletePdf.mutateAsync(id)
      } else await deleteNote.mutateAsync(id)
    } catch {
      /* errors handled by mutation */
    }
    menu.close()
  }

  function handleRenameStart() {
    edit.start()
    menu.close()
  }

  function handleManageTags() {
    menu.close()
    menu.openTags()
  }

  return (
    <>
      <div
        role={isPdf ? 'button' : 'button'}
        tabIndex={0}
        aria-current={active ? 'page' : undefined}
        aria-expanded={isPdf ? expanded : undefined}
        className={cn(
          'q-note-item',
          active && 'q-note-item--active',
          className,
        )}
        onClick={edit.editing ? undefined : handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <div className="q-note-item__title-row">
          {isPdf && (
            <span
              className="q-note-item__expand-icon"
              aria-hidden="true"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((v) => !v)
              }}
            >
              {expanded ? (
                <ChevronDown size={13} strokeWidth={2} />
              ) : (
                <ChevronRight size={13} strokeWidth={2} />
              )}
            </span>
          )}

          {edit.editing ? (
            <input
              ref={edit.inputRef}
              type="text"
              value={edit.editName}
              onChange={(e) => edit.setEditName(e.target.value)}
              onBlur={edit.commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') edit.commit()
                if (e.key === ' ') e.stopPropagation()
              }}
              className="q-note-item__edit-input"
            />
          ) : (
            <span className="q-note-item__title">{name}</span>
          )}

          <div className="q-note-item__title-actions">
            {!!viewLater && !edit.editing && (
              <span
                className="q-note-item__view-later"
                aria-label="Saved for later"
              >
                <Bookmark size={12} strokeWidth={2} />
              </span>
            )}
            <button
              className="q-note-item__menu-btn"
              aria-label="More options"
              onClick={handleMenuButtonClick}
            >
              <MoreHorizontal size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {(displayTags.length > 0 || createdAt || pdfName) && (
          <div className="q-note-item__meta">
            {pdfName && (
              <Badge variant="outline" className="q-note-item__pdf">
                <FileText size={9} strokeWidth={2} />
                PDF
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

      {isPdf && expanded && pdfNotes.length > 0 && (
        <div className="q-note-item__pdf-children">
          {pdfNotes.map((note) => (
            <PdfNoteItem
              key={note.id}
              id={note.id}
              name={note.name}
              pdfId={id}
              pdfPage={note.pdf_page}
              tags={pdfNoteTagsMap.get(note.id) ?? []}
              createdAt={note.created_at}
              viewLater={note.view_later}
            />
          ))}
        </div>
      )}

      {menu.isContextOpen && (
        <NoteItemMenu
          position={menu.position}
          menuRef={menu.menuRef}
          onRename={handleRenameStart}
          onManageTags={handleManageTags}
          onDelete={handleDelete}
        />
      )}

      {menu.isTagsOpen && (
        <TagMenu
          position={menu.position}
          allTags={tagOps.allTags}
          selectedTagIds={tagOps.selectedTagIds}
          newTagName={tagOps.newTagName}
          onNewTagNameChange={tagOps.setNewTagName}
          onToggleTag={tagOps.toggleTag}
          onCreateTag={tagOps.createAndAttach}
          onClose={menu.close}
        />
      )}
    </>
  )
}
