import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import { serializeAsJSON } from '@excalidraw/excalidraw'
import { useNote } from '#/hooks'
import {
  useUpdateNote,
  useDeleteNote,
  useToggleViewLater,
} from '#/hooks/useNotes'
import type { Note } from '#/types/types'
import { Spinner } from '#/components/ui'
import { Trash2, Bookmark, BookmarkCheck, Edit3 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { PromptDialog, ConfirmDialog } from '#/components/ui/Dialog'
import { Sidebar } from '../Sidebar'
import { FileStorage } from '#/lib/FileStorage'
import { DEFAULT_EXCALIDRAW_APP_STATE } from '#/lib/excalidrawConfig'
import '@excalidraw/excalidraw/index.css'

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
  const [isLoading, setIsLoading] = useState(true)
  const [fileContent, setFileContent] = useState('')

  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUserChangeRef = useRef(true)
  const initialLoadCompleteRef = useRef(false)
  const lastSavedElementsRef = useRef<string>('')
  const previousNoteIdRef = useRef<string | null>(null)

  const drawingPath = useMemo(() => {
    if (!note?.id) return ''
    return FileStorage.buildNotePath(note.id)
  }, [note?.id])

  useEffect(() => {
    async function loadFile() {
      if (!drawingPath) return

      if (
        drawingPath !==
        FileStorage.buildNotePath(previousNoteIdRef.current as string)
      ) {
        previousNoteIdRef.current = note?.id || null
        setIsLoading(true)
        isUserChangeRef.current = false
        initialLoadCompleteRef.current = false

        try {
          const exists = await FileStorage.exists(drawingPath)
          if (exists) {
            const content = await FileStorage.readAsText(drawingPath)
            setFileContent(content)
          } else {
            setFileContent('')
          }
        } catch (error) {
          console.error('Error loading file:', error)
          setFileContent('')
        }
      }
    }

    loadFile()
  }, [drawingPath, note?.id])

  const initialData = useMemo(() => {
    if (!fileContent) {
      return {
        appState: DEFAULT_EXCALIDRAW_APP_STATE,
      }
    }

    try {
      const data = JSON.parse(fileContent)
      lastSavedElementsRef.current = JSON.stringify(data.elements || [])

      return {
        elements: data.elements || [],
        appState: {
          ...data.appState,
          ...DEFAULT_EXCALIDRAW_APP_STATE,
          zoom: { value: 1 },
          scrollX: 0,
          scrollY: 0,
        },
        files: data.files,
      }
    } catch (error) {
      console.error('Error parsing file content:', error)
      return {
        appState: DEFAULT_EXCALIDRAW_APP_STATE,
      }
    }
  }, [fileContent])

  useEffect(() => {
    if (!excalidrawAPIRef.current || !initialData || !isLoading) {
      return
    }

    const timer = setTimeout(() => {
      if (initialData.elements?.length) {
        excalidrawAPIRef.current?.updateScene({
          elements: initialData.elements,
          appState: initialData.appState,
        })
        excalidrawAPIRef.current?.scrollToContent(initialData.elements, {
          fitToContent: true,
        })
      }

      setTimeout(() => {
        setIsLoading(false)
        initialLoadCompleteRef.current = true

        setTimeout(() => {
          isUserChangeRef.current = true
        }, 300)
      }, 100)
    }, 100)

    return () => clearTimeout(timer)
  }, [initialData, isLoading])

  const handleAutoSave = useCallback(
    async (elements: readonly any[], appState: any) => {
      if (!excalidrawAPIRef.current || !drawingPath) return

      if (!isUserChangeRef.current || !initialLoadCompleteRef.current) {
        const currentElements = JSON.stringify(elements || [])
        lastSavedElementsRef.current = currentElements
        return
      }

      const currentElements = JSON.stringify(elements || [])

      if (currentElements === lastSavedElementsRef.current) {
        return
      }

      lastSavedElementsRef.current = currentElements

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(async () => {
        const jsonString = serializeAsJSON(
          elements,
          appState,
          excalidrawAPIRef.current!.getFiles(),
          'local',
        )

        await FileStorage.write(drawingPath, jsonString)
      }, 500)
    },
    [drawingPath],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [drawingPath])

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
      <div className="quartz h-full w-full flex items-center justify-center">
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

      <div className="relative flex-1 overflow-hidden" key={note.id}>
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <div className="text-center">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-4">Loading...</p>
            </div>
          </div>
        )}

        <div
          className={`w-full h-full ${isLoading ? 'invisible' : 'visible'} custom-styles`}
        >
          <Excalidraw
            excalidrawAPI={(api) => (excalidrawAPIRef.current = api)}
            theme="light"
            gridModeEnabled={true}
            onChange={handleAutoSave}
            initialData={initialData}
          />
        </div>
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
