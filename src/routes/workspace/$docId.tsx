import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import type { useDatabase } from '#/providers'
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
  validateSearch: (search: Record<string, unknown>) => {
    return {
      initialPage: search.initialPage ? Number(search.initialPage) : undefined,
      noteId: search.noteId as string | undefined,
    }
  },
  component: Workspace,
})

function Workspace() {
  const { docId } = Route.useParams()
  const { initialPage: searchInitialPage, noteId: searchNoteId } =
    Route.useSearch()
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { activeNoteId, setActiveNoteId } = useWorkspace()
  const [initialPage, setInitialPage] = useState<number | undefined>()
  const isInitialLoadRef = useRef(true)

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

      if (searchNoteId) {
        const note = await db.notes.findById(searchNoteId)
        if (note && note.pdf_id === docId) {
          setWorkspaceData({ type: 'pdf', data: { id: docId } } as PdfData)
          setInitialPage(note.pdf_page)
          setActiveNoteId(searchNoteId)
          setIsLoading(false)
          return
        }
      }

      const note = await db.notes.findById(docId)
      if (note) {
        setWorkspaceData({ type: 'note', data: note } as NoteData)
        setInitialPage(note.pdf_page)
        setIsLoading(false)
        return
      }

      const pdf = await db.pdfs.findById(docId)
      if (pdf) {
        setWorkspaceData({ type: 'pdf', data: pdf } as PdfData)
        if (isInitialLoadRef.current && searchInitialPage) {
          setInitialPage(searchInitialPage)
        }
        setIsLoading(false)
        setActiveNoteId(null)
        isInitialLoadRef.current = false
        return
      }

      setWorkspaceData({ type: 'not-found' } as NotFoundData)
      setIsLoading(false)
    }

    loadData()
  }, [docId, searchNoteId, setActiveNoteId])

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
          <div className="h-full bg-(--q-bg)">
            {activeNoteId ? <Canvas noteId={activeNoteId} /> : <NoteNotFound />}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} minSize={0}>
          <PdfViewer pdf={workspaceData.data} initialPage={initialPage} />
        </ResizablePanel>
      </ResizablePanelGroup>
    )
  }

  return <Canvas note={workspaceData.data} />
}
