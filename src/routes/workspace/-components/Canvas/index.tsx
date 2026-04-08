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
import { ArrowLeft, Trash2, Bookmark, BookmarkCheck, Edit3 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PromptDialog, ConfirmDialog } from '#/components/ui/Dialog'

interface CanvasProps {
  noteId?: string
  note?: Note
}

export function Canvas({ noteId, note: noteProp }: CanvasProps) {
  const navigate = useNavigate()
  const noteQuery = useNote(noteId || '')
  const note = noteProp || noteQuery.data
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
      <div className="w-14 border-r border-(--q-border) bg-(--q-bg) flex flex-col py-4">
        <button
          onClick={() => navigate({ to: '/' })}
          className="group flex items-center justify-center w-10 h-10 mx-auto mb-2 text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale) rounded-md transition-colors relative"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Back
          </span>
        </button>

        <button
          onClick={() => {
            setTempName(note.name)
            setShowRenameDialog(true)
          }}
          className="group flex items-center justify-center w-10 h-10 mx-auto mb-2 text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale) rounded-md transition-colors relative"
        >
          <Edit3 className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Rename
          </span>
        </button>

        <button
          onClick={handleToggleViewLater}
          className={`group flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md transition-colors relative ${
            note.view_later
              ? 'text-(--q-green) bg-(--q-green-pale)'
              : 'text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale)'
          }`}
        >
          {note.view_later ? (
            <BookmarkCheck className="w-5 h-5" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {note.view_later ? 'Saved' : 'Save'}
          </span>
        </button>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="group flex items-center justify-center w-10 h-10 mx-auto mt-auto text-red-500 hover:bg-red-500/10 rounded-md transition-colors relative"
        >
          <Trash2 className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Delete
          </span>
        </button>
      </div>

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
