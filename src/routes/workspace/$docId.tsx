import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useDatabase } from '#/providers'
import { useWorkspace } from '#/context/WorkspaceContext'
import type { Note, PDF } from '#/types/types'
import { Canvas } from './-components/Canvas'
import { NoteNotFound } from './-components/NoteNotFound'
import PdfViewer from './-components/PdfViewer'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '#/components/ui'

interface NoteData {
  type: 'note'
  data: Note
}

interface PdfData {
  type: 'pdf'
  data: PDF
}

interface NotFoundData {
  type: 'not-found'
}

type WorkspaceData = NoteData | PdfData | NotFoundData

export const Route = createFileRoute('/workspace/$docId')({
  component: Workspace,
})

function Workspace() {
  const { docId } = Route.useParams()
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { activeNoteId, setActiveNoteId } = useWorkspace()

  useEffect(() => {
    async function loadData() {
      const db = (window as any).__db as
        | ReturnType<typeof useDatabase>
        | undefined
      if (!db) {
        setWorkspaceData({ type: 'not-found' } as NotFoundData)
        setIsLoading(false)
        return
      }

      const note = await db.notes.findById(docId)
      if (note) {
        setWorkspaceData({ type: 'note', data: note } as NoteData)
        setIsLoading(false)
        return
      }

      const pdf = await db.pdfs.findById(docId)
      if (pdf) {
        setWorkspaceData({ type: 'pdf', data: pdf } as PdfData)
        setIsLoading(false)
        setActiveNoteId(null)
        return
      }

      setWorkspaceData({ type: 'not-found' } as NotFoundData)
      setIsLoading(false)
    }

    loadData()
  }, [docId, setActiveNoteId])

  if (isLoading || !workspaceData) {
    return (
      <div className="quartz h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-q-green-mid font-sans text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  if (workspaceData.type === 'not-found') {
    return <NoteNotFound />
  }

  if (workspaceData.type === 'pdf') {
    return (
      <ResizablePanelGroup orientation="horizontal" className="h-screen">
        <ResizablePanel defaultSize={50} minSize={0}>
          <div className="h-full bg-[var(--q-bg)]">
            {activeNoteId ? <Canvas noteId={activeNoteId} /> : <NoteNotFound />}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={0}>
          <PdfViewer pdf={workspaceData.data} />
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return <Canvas note={workspaceData.data} />
}
