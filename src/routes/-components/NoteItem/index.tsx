import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontal, Trash2, Edit3, Tag, Plus, X, FileText } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import { Badge } from '#/components/ui'
import {
  useUpdateNote,
  useDeleteNote,
  useUpdatePdf,
  useDeletePdf,
  useTags,
  useCreateTag,
  useAddTagToNote,
  useRemoveTagFromNote,
  useAddTagToPdf,
  useRemoveTagFromPdf,
} from '#/hooks'
import { FileStorage } from '#/lib/FileStorage'
import type { Tag as TagType } from '#/types/types'
import './NoteItem.css'

export interface NoteItemProps {
  id: string
  name: string
  tags?: TagType[]
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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NoteItem({
  id,
  name,
  tags = [],
  createdAt,
  pdfName,
  active = false,
  onClick,
  className,
}: NoteItemProps) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [newTagName, setNewTagName] = useState('')
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const updatePdf = useUpdatePdf()
  const deletePdf = useDeletePdf()
  const { data: allTags = [] } = useTags()
  const createTag = useCreateTag()
  const addTagToNote = useAddTagToNote()
  const removeTagFromNote = useRemoveTagFromNote()
  const addTagToPdf = useAddTagToPdf()
  const removeTagFromPdf = useRemoveTagFromPdf()

  const isPdf = !!pdfName
  const tagIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags])
  const displayTags = useMemo(() => tags.slice(0, 10), [tags])
  const remainingCount = tags.length - 10

  // ── Navigation ─────────────────────────────────────────────
  function handleClick() {
    if (onClick) { onClick(); return }
    navigate({ to: '/workspace/$docId', params: { docId: id } })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() }
  }

  function openMenu(x: number, y: number) {
    setMenuPos({ x, y })
    setMenuOpen(true)
    setTagMenuOpen(false)
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault()
    openMenu(e.clientX, e.clientY)
  }

  // ── Rename ─────────────────────────────────────────────────
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function handleRename() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === name) { setEditing(false); setEditName(name); return }
    try {
      if (isPdf) await updatePdf.mutateAsync({ id, updates: { name: trimmed } })
      else await updateNote.mutateAsync({ id, updates: { name: trimmed } })
    } catch { /* silent */ }
    setEditing(false)
  }

  // ── Delete ─────────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      if (isPdf) { await FileStorage.deleteDir(id); await deletePdf.mutateAsync(id) }
      else await deleteNote.mutateAsync(id)
    } catch { /* silent */ }
    setMenuOpen(false)
  }

  // ── Tags ───────────────────────────────────────────────────
  async function handleToggleTag(tag: TagType) {
    const has = tagIds.has(tag.id)
    try {
      if (isPdf) {
        has
          ? await removeTagFromPdf.mutateAsync({ tagId: tag.id, pdfId: id })
          : await addTagToPdf.mutateAsync({ tagId: tag.id, pdfId: id })
      } else {
        has
          ? await removeTagFromNote.mutateAsync({ tagId: tag.id, noteId: id })
          : await addTagToNote.mutateAsync({ tagId: tag.id, noteId: id })
      }
    } catch { /* silent */ }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    try {
      const tagId = await createTag.mutateAsync(newTagName.trim())
      if (isPdf) await addTagToPdf.mutateAsync({ tagId, pdfId: id })
      else await addTagToNote.mutateAsync({ tagId, noteId: id })
      setNewTagName('')
    } catch { /* silent */ }
  }

  // ── Click-outside for menus ────────────────────────────────
  useEffect(() => {
    function onClickOutside(e: globalThis.MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setTagMenuOpen(false)
      }
    }
    if (menuOpen || tagMenuOpen) document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [menuOpen, tagMenuOpen])

  useEffect(() => {
    function onEsc(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') { setEditing(false); setEditName(name) }
    }
    if (editing) window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [editing, name])

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-current={active ? 'page' : undefined}
        className={cn('q-note-item', active && 'q-note-item--active', className)}
        onClick={editing ? undefined : handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        {/* Title row */}
        <div className="q-note-item__title-row">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === ' ') e.stopPropagation()
              }}
              className="q-note-item__edit-input"
            />
          ) : (
            <span className="q-note-item__title">{name}</span>
          )}

          <button
            className="q-note-item__menu-btn"
            aria-label="More options"
            onClick={(e) => {
              e.stopPropagation()
              const r = e.currentTarget.getBoundingClientRect()
              openMenu(r.left, r.bottom + 4)
            }}
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </button>
        </div>

        {/* Meta row */}
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

      {/* Context menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="q-note-item__menu"
          style={{ left: menuPos.x, top: menuPos.y }}
          role="menu"
        >
          <button
            className="q-note-item__menu-item"
            role="menuitem"
            onClick={() => { setEditing(true); setEditName(name); setMenuOpen(false) }}
          >
            <Edit3 size={13} strokeWidth={1.75} />
            Rename
          </button>
          <button
            className="q-note-item__menu-item"
            role="menuitem"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setTagMenuOpen(true) }}
          >
            <Tag size={13} strokeWidth={1.75} />
            Manage Tags
          </button>
          <div className="q-note-item__menu-divider" />
          <button
            className="q-note-item__menu-item q-note-item__menu-item--danger"
            role="menuitem"
            onClick={handleDelete}
          >
            <Trash2 size={13} strokeWidth={1.75} />
            Delete
          </button>
        </div>
      )}

      {/* Tag menu */}
      {tagMenuOpen && (
        <div
          className="q-note-item__menu q-note-item__tag-menu"
          style={{ left: menuPos.x, top: menuPos.y }}
          role="dialog"
          aria-label="Manage tags"
        >
          <div className="q-note-item__tag-menu-header">
            <span className="q-note-item__tag-menu-title">Tags</span>
            <button
              className="q-note-item__tag-menu-close"
              onClick={() => setTagMenuOpen(false)}
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
                  tagIds.has(tag.id) && 'q-note-item__tag-option--selected',
                )}
                onClick={() => handleToggleTag(tag)}
              >
                <span className="q-note-item__tag-check">
                  {tagIds.has(tag.id) && '✓'}
                </span>
                {tag.name}
              </button>
            ))}
          </div>

          <div className="q-note-item__tag-create">
            <input
              type="text"
              placeholder="New tag…"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTag() }}
              className="q-note-item__tag-input"
              aria-label="New tag name"
            />
            <button
              className="q-note-item__tag-add-btn"
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              aria-label="Add tag"
            >
              <Plus size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
