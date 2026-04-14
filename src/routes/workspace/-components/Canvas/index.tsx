import { useState } from 'react'
import { Tldraw } from 'tldraw'
import { useNote } from '#/hooks'
import {
  useUpdateNote,
  useDeleteNote,
  useToggleViewLater,
} from '#/hooks/useNotes'
import type { Note } from '#/types/types'
import 'tldraw/tldraw.css'
import { Spinner } from '#/components/ui'
import { Trash2, Bookmark, BookmarkCheck, Edit3 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PromptDialog, ConfirmDialog } from '#/components/ui/Dialog'
import { Sidebar } from '../Sidebar'

interface CanvasProps {
  noteId?: string
  note?: Note
}

export function Canvas({ noteId, note: noteProp }: CanvasProps) {
  const navigate = useNavigate()
  const noteQuery = useNote(noteId || '')
  const note = noteQuery.data || noteProp
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const toggleViewLater = useToggleViewLater()

  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [tempName, setTempName] = useState('')

  const handleRename = (newName: string) => {
    if (note && newName.trim()) {
      updateNote.mutate({ id: note.id, updates: { name: newName.trim() } })
    }
  }

  const handleDelete = () => {
    if (note) {
      deleteNote.mutate(note.id)
      navigate({ to: '/' })
    }
  }

  const handleToggleViewLater = () => {
    if (note) {
      toggleViewLater.mutate(note.id)
    }
  }

  if (!note && noteQuery.isLoading) {
    return (
      <div className="quartz h-screen w-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="quartz h-screen w-full flex items-center justify-center">
        <span className="text-(--q-text-muted)">Note not found.</span>
      </div>
    )
  }

  return (
    <div className="quartz h-screen w-full flex">
      <Sidebar
        actions={[
          {
            id: 'rename',
            icon: Edit3,
            label: 'Rename',
            onClick: () => {
              setTempName(note.name)
              setShowRenameDialog(true)
            },
          },
          {
            id: 'viewLater',
            icon: note.view_later ? BookmarkCheck : Bookmark,
            label: note.view_later ? 'Saved' : 'Save',
            onClick: handleToggleViewLater,
            active: note.view_later,
          },
          {
            id: 'delete',
            icon: Trash2,
            label: 'Delete',
            onClick: () => setShowDeleteDialog(true),
            variant: 'danger',
          },
        ]}
      />

      <div className="flex-1 overflow-hidden">
        <Tldraw persistenceKey={note.id} />
      </div>

      <PromptDialog
        isOpen={showRenameDialog}
        onClose={() => setShowRenameDialog(false)}
        title="Rename Note"
        defaultValue={tempName}
        onConfirm={handleRename}
        confirmText="Rename"
        placeholder="Enter new name"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        onConfirm={handleDelete}
        confirmText="Delete"
        important={true}
      />
    </div>
  )
}
