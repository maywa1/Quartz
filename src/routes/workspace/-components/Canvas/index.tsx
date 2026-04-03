import { Tldraw } from 'tldraw'
import { useNote } from '#/hooks'
import type { Note } from '#/types/types'
import 'tldraw/tldraw.css'

interface CanvasProps {
  noteId?: string
  note?: Note
}

export function Canvas({ noteId, note: noteProp }: CanvasProps) {
  const noteQuery = useNote(noteId || '')
  const note = noteProp || noteQuery.data

  if (!note) {
    return (
      <div className="quartz h-screen w-full flex items-center justify-center">
        <span className="text-[var(--q-text-muted)]">Loading note...</span>
      </div>
    )
  }

  return (
    <div className="quartz h-screen w-full overflow-hidden">
      <Tldraw persistenceKey={note.id} />
    </div>
  )
}
