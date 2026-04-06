import { Tldraw } from 'tldraw'
import { useNote } from '#/hooks'
import type { Note } from '#/types/types'
import 'tldraw/tldraw.css'
import { Spinner } from '#/components/ui'

interface CanvasProps {
  noteId?: string
  note?: Note
}

export function Canvas({ noteId, note: noteProp }: CanvasProps) {
  const noteQuery = useNote(noteId || '')
  const note = noteProp || noteQuery.data

  if (!note && noteQuery.isLoading) {
    return (
      <div className="quartz h-screen w-full flex items-center justify-center">
        <Spinner/>
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
    <div className="quartz h-screen w-full overflow-hidden">
      <Tldraw persistenceKey={note.id} />
    </div>
  )
}
