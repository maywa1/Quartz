import { Tldraw } from 'tldraw'
import type { Note } from '#/types/types'
import 'tldraw/tldraw.css'

interface CanvasProps {
  note: Note
}

export function Canvas({ note }: CanvasProps) {
  return (
    <div className="quartz h-screen w-full overflow-hidden">
      <Tldraw persistenceKey={note.id} />
    </div>
  )
}
