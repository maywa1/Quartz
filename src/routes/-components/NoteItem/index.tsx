import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { useNavigate } from '@tanstack/react-router'
import { MoreHorizontal, Trash2, Edit3, Tag, Plus, X } from 'lucide-react'
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
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
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

  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const updatePdfMutation = useUpdatePdf()
  const deletePdfMutation = useDeletePdf()
  const tagsQuery = useTags()
  const createTagMutation = useCreateTag()
  const addTagToNoteMutation = useAddTagToNote()
  const removeTagFromNoteMutation = useRemoveTagFromNote()
  const addTagToPdfMutation = useAddTagToPdf()
  const removeTagFromPdfMutation = useRemoveTagFromPdf()

  const allTags = tagsQuery.data ?? []
  const isPdf = !!pdfName
  const tagIds = new Set(tags.map((t) => t.id))

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate({ to: '/workspace/$docId', params: { docId: id } })
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }

  const handleRename = async () => {
    if (!editName.trim() || editName === name) {
      setEditing(false)
      setEditName(name)
      return
    }

    try {
      if (isPdf) {
        await updatePdfMutation.mutateAsync({
          id,
          updates: { name: editName.trim() },
        })
      } else {
        await updateNoteMutation.mutateAsync({
          id,
          updates: { name: editName.trim() },
        })
      }
    } catch (err) {
      console.error('Failed to rename:', err)
    }
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      if (isPdf) {
        await FileStorage.deleteDir(id)
        await deletePdfMutation.mutateAsync(id)
      } else {
        await deleteNoteMutation.mutateAsync(id)
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    }
    setMenuOpen(false)
  }

  const handleToggleTag = async (tag: TagType) => {
    try {
      if (isPdf) {
        if (tagIds.has(tag.id)) {
          await removeTagFromPdfMutation.mutateAsync({
            tagId: tag.id,
            pdfId: id,
          })
        } else {
          await addTagToPdfMutation.mutateAsync({ tagId: tag.id, pdfId: id })
        }
      } else {
        if (tagIds.has(tag.id)) {
          await removeTagFromNoteMutation.mutateAsync({
            tagId: tag.id,
            noteId: id,
          })
        } else {
          await addTagToNoteMutation.mutateAsync({ tagId: tag.id, noteId: id })
        }
      }
    } catch (err) {
      console.error('Failed to toggle tag:', err)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const tagId = await createTagMutation.mutateAsync(newTagName.trim())
      if (isPdf) {
        await addTagToPdfMutation.mutateAsync({ tagId, pdfId: id })
      } else {
        await addTagToNoteMutation.mutateAsync({ tagId, noteId: id })
      }
      setNewTagName('')
    } catch (err) {
      console.error('Failed to create tag:', err)
    }
  }

  const startEditing = () => {
    setEditing(true)
    setEditName(name)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setTagMenuOpen(false)
      }
    }

    if (menuOpen || tagMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen, tagMenuOpen])

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(false)
        setEditName(name)
      }
    }
    if (editing) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editing, name])

  const displayTags = useMemo(() => tags.slice(0, 3), [tags])
  const remainingCount = tags.length - 3

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'q-note-item',
          active && 'q-note-item--active',
          className,
        )}
        onClick={editing ? undefined : handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
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
            onClick={(e) => {
              e.stopPropagation()
              const rect = e.currentTarget.getBoundingClientRect()
              setMenuPos({ x: rect.left, y: rect.bottom + 4 })
              setMenuOpen(true)
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
        {(displayTags.length > 0 || createdAt || pdfName) && (
          <div className="q-note-item__meta">
            {pdfName && (
              <Badge variant="outline" className="q-note-item__pdf">
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

      {menuOpen && (
        <div
          ref={menuRef}
          className="q-note-item__menu"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <button className="q-note-item__menu-item" onClick={startEditing}>
            <Edit3 className="w-4 h-4" />
            Rename
          </button>
          <button
            className="q-note-item__menu-item"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(false)
              setTagMenuOpen(true)
            }}
          >
            <Tag className="w-4 h-4" />
            Manage Tags
          </button>
          <button
            className="q-note-item__menu-item q-note-item__menu-item--danger"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {tagMenuOpen && (
        <div
          className="q-note-item__menu q-note-item__tag-menu"
          style={{ left: menuPos.x, top: menuPos.y }}
        >
          <div className="q-note-item__tag-menu-header">
            <span className="q-note-item__tag-menu-title">Tags</span>
            <button
              className="q-note-item__tag-menu-close"
              onClick={() => setTagMenuOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="q-note-item__tag-list">
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
              placeholder="New tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTag()
              }}
              className="q-note-item__tag-input"
            />
            <button
              className="q-note-item__tag-add-btn"
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
