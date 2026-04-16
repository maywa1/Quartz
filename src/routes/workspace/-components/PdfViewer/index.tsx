import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { useNotesByPdf, useCreateNote } from '#/hooks'
import { FileStorage } from '#/lib/FileStorage'
import { useWorkspace } from '#/context/WorkspaceContext'
import { PromptDialog } from '#/components/ui/Dialog'
import { Button } from '#/components/ui/Button/Button'
import type { PDF, Note } from '#/types/types'
import LongPressRing from './LongPressRing'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

interface Props {
  pdf: PDF
  initialPage?: number
}

interface Coordinates {
  x: number
  y: number
  page: number
}

export default function PdfViewer({ pdf, initialPage }: Props) {
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.5)
  const [noteCoordinates, setNoteCoordinates] = useState<
    Coordinates | undefined
  >()
  const { setActiveNoteId, setActivePdfId } = useWorkspace()

  const notesQuery = useNotesByPdf(pdf.id)
  const createNoteMutation = useCreateNote()
  const notes = notesQuery.data ?? []

  // Long-press ring state
  const [ringState, setRingState] = useState<{
    visible: boolean
    x: number
    y: number
    progress: number
  }>({ visible: false, x: 0, y: 0, progress: 0 })

  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartRef = useRef<number>(0)
  const holdPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const holdPageRef = useRef<number>(0)
  const holdPdfCoordsRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const isHoldingRef = useRef(false)
  const HOLD_DURATION = 600 // ms to fill ring

  useEffect(() => {
    setActivePdfId(pdf.id)
  }, [pdf.id, setActivePdfId])

  const colors = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      noteGold: style.getPropertyValue('--q-green-deep').trim() || '#166534',
      noteGoldStroke:
        style.getPropertyValue('--q-green-mid').trim() || '#22c55e',
      noteMuted: style.getPropertyValue('--q-text-muted').trim() || '#4b5563',
      noteMutedStroke: style.getPropertyValue('--q-border').trim() || '#d1fae5',
    }
  }, [])

  const notesPerPageRef = useRef<{ [pageNum: number]: Note[] }>({})
  const renderedPagesRef = useRef<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const handleNoteSubmit = async (name: string) => {
    if (!noteCoordinates) return
    try {
      const noteId = await createNoteMutation.mutateAsync({
        name,
        pdfId: pdf.id,
        coordinates: {
          x: noteCoordinates.x,
          y: noteCoordinates.y,
          page: noteCoordinates.page,
        },
      })
      setActiveNoteId(noteId)
      setShowNoteDialog(false)
    } catch (err) {
      console.error('Failed to create note', err)
    }
  }

  // --- Touch/pen scroll ---

  const isDraggingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const scrollStartRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0 })

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
      holdTimerRef.current = null
    }
    isHoldingRef.current = false
    setRingState({ visible: false, x: 0, y: 0, progress: 0 })
  }, [])

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === 'pen' || e.pointerType === 'touch') {
      isDraggingRef.current = true
      startPosRef.current = { x: e.clientX, y: e.clientY }
      scrollStartRef.current = {
        x: scrollContainerRef.current?.scrollLeft || 0,
        y: scrollContainerRef.current?.scrollTop || 0,
      }
      lastMoveTimeRef.current = Date.now()
      velocityRef.current = { x: 0, y: 0 }
    }
  }, [])

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current || !scrollContainerRef.current) return
      const currentTime = Date.now()
      const deltaTime = currentTime - lastMoveTimeRef.current
      const deltaX = startPosRef.current.x - e.clientX
      const deltaY = startPosRef.current.y - e.clientY
      if (deltaTime > 0) {
        velocityRef.current = { x: deltaX / deltaTime, y: deltaY / deltaTime }
      }
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (dist > 8 && isHoldingRef.current) cancelHold()
      scrollContainerRef.current.scrollLeft = scrollStartRef.current.x + deltaX
      scrollContainerRef.current.scrollTop = scrollStartRef.current.y + deltaY
      lastMoveTimeRef.current = currentTime
    },
    [cancelHold],
  )

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
    cancelHold()
  }, [cancelHold])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return
    scrollContainer.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      scrollContainer.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp])

  // Cancel hold when mouse moves too far or is released
  useEffect(() => {
    const onUp = () => cancelHold()
    const onMove = (e: MouseEvent) => {
      if (!isHoldingRef.current) return
      const dx = e.clientX - holdPosRef.current.x
      const dy = e.clientY - holdPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > 8) cancelHold()
    }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('mousemove', onMove)
    }
  }, [cancelHold])

  const startHold = useCallback(
    (
      clientX: number,
      clientY: number,
      pageNum: number,
      pdfX: number,
      pdfY: number,
    ) => {
      cancelHold()
      isHoldingRef.current = true
      holdStartRef.current = Date.now()
      holdPosRef.current = { x: clientX, y: clientY }
      holdPageRef.current = pageNum
      holdPdfCoordsRef.current = { x: pdfX, y: pdfY }

      setRingState({ visible: true, x: clientX, y: clientY, progress: 0 })

      holdTimerRef.current = setInterval(() => {
        if (!isHoldingRef.current) return
        const elapsed = Date.now() - holdStartRef.current
        const progress = Math.min(elapsed / HOLD_DURATION, 1)
        setRingState({ visible: true, x: clientX, y: clientY, progress })

        if (progress >= 1) {
          cancelHold()
          setNoteCoordinates({
            x: holdPdfCoordsRef.current.x,
            y: holdPdfCoordsRef.current.y,
            page: holdPageRef.current,
          })
          setShowNoteDialog(true)
        }
      }, 16)
    },
    [cancelHold],
  )

  const handleCanvasMouseDown = useCallback(
    async (e: MouseEvent, pageNum: number) => {
      if (e.button !== 0) return
      if (!pdfDoc) return

      const canvas = e.target as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const pdfX = x / scale
      const pdfY = (viewport.height - y) / scale

      // Tap an existing note marker
      const pageNotes = notesPerPageRef.current[pageNum]
      for (const note of pageNotes) {
        if (!note.pdf_coordinate_x || !note.pdf_coordinate_y) continue
        const noteCanvasX = note.pdf_coordinate_x * scale
        const noteCanvasY = viewport.height - note.pdf_coordinate_y * scale
        const distance = Math.sqrt(
          Math.pow(x - noteCanvasX, 2) + Math.pow(y - noteCanvasY, 2),
        )
        if (distance <= 12) {
          setActiveNoteId(note.id)
          return
        }
      }

      startHold(e.clientX, e.clientY, pageNum, pdfX, pdfY)
    },
    [pdfDoc, scale, setActiveNoteId, startHold],
  )

  const drawNotesOnPage = useCallback(
    (
      context: CanvasRenderingContext2D,
      viewport: pdfjsLib.PageViewport,
      pageNum: number,
    ) => {
      const pageNotes: Note[] = []
      notes.forEach((note) => {
        if (!note.pdf_coordinate_x || !note.pdf_coordinate_y || !note.pdf_page)
          return
        if (note.pdf_page !== pageNum) return
        pageNotes.push(note)

        const canvasX = note.pdf_coordinate_x * scale
        const canvasY = viewport.height - note.pdf_coordinate_y * scale

        context.beginPath()
        context.arc(canvasX, canvasY, 8, 0, 2 * Math.PI)
        if (note.view_later) {
          context.fillStyle = colors.noteGold
          context.fill()
          context.strokeStyle = colors.noteGoldStroke
          context.lineWidth = 2
          context.stroke()
        } else {
          context.fillStyle = colors.noteMuted
          context.fill()
          context.strokeStyle = colors.noteMutedStroke
          context.lineWidth = 2
          context.stroke()
        }
      })
      notesPerPageRef.current[pageNum] = pageNotes
    },
    [notes, scale, colors],
  )

  const renderPage = useCallback(
    async (pageNum: number, placeholder: HTMLDivElement) => {
      if (!pdfDoc) return

      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.className = 'cursor-crosshair border border-gray-300 select-none'
      canvas.dataset.pageNumber = pageNum.toString()

      canvas.addEventListener('mousedown', (e) =>
        handleCanvasMouseDown(e, pageNum),
      )

      placeholder.style.width = `${viewport.width}px`
      placeholder.style.height = `${viewport.height}px`
      placeholder.replaceChildren(canvas)

      await page.render({ canvasContext: context, viewport, canvas }).promise

      drawNotesOnPage(context, viewport, pageNum)
    },
    [pdfDoc, scale, handleCanvasMouseDown, drawNotesOnPage],
  )

  // Load PDF
  useEffect(() => {
    let isMounted = true
    const loadPdf = async () => {
      try {
        if (containerRef.current) containerRef.current.innerHTML = ''
        setPdfDoc(null)
        setNumPages(0)

        const pdfPath = FileStorage.buildPdfPath(pdf.id)
        const arrayBuffer = await FileStorage.read(pdfPath)
        const typedArray = new Uint8Array(arrayBuffer)

        if (isMounted) {
          const loadedPdf = await pdfjsLib.getDocument(typedArray).promise
          setPdfDoc(loadedPdf)
          setNumPages(loadedPdf.numPages)
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Failed to load PDF:', error)
          setPdfDoc(null)
          setNumPages(0)
        }
      }
    }
    loadPdf()
    return () => {
      isMounted = false
    }
  }, [pdf.id])

  // Build placeholders + IntersectionObserver
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || !scrollContainerRef.current) return

    if (observerRef.current) observerRef.current.disconnect()

    containerRef.current.innerHTML = ''
    notesPerPageRef.current = {}
    renderedPagesRef.current = new Set()

    const placeholders: HTMLDivElement[] = []

    const buildPlaceholders = async () => {
      if (!containerRef.current || !scrollContainerRef.current) return

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const placeholder = document.createElement('div')
        placeholder.dataset.pageNumber = pageNum.toString()
        placeholder.className = 'mb-4 mx-auto bg-gray-200'

        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        placeholder.style.width = `${viewport.width}px`
        placeholder.style.height = `${viewport.height}px`

        containerRef.current.appendChild(placeholder)
        placeholders.push(placeholder)
      }

      // Scroll to initial page immediately after placeholders are sized,
      // before any rendering starts so there's no animation or flash.
      if (initialPage && initialPage > 1) {
        const targetPlaceholder = placeholders[initialPage - 1]
        if (targetPlaceholder) {
          scrollContainerRef.current.scrollTop = targetPlaceholder.offsetTop
        }
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            const el = entry.target as HTMLDivElement
            const pageNum = Number(el.dataset.pageNumber)
            if (renderedPagesRef.current.has(pageNum)) continue
            renderedPagesRef.current.add(pageNum)
            renderPage(pageNum, el)
          }
        },
        {
          root: scrollContainerRef.current,
          rootMargin: '200px 0px 200px 0px',
          threshold: 0,
        },
      )

      observerRef.current = observer
      placeholders.forEach((p) => observer.observe(p))
    }

    buildPlaceholders()

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [pdfDoc, numPages, scale, renderPage, initialPage])

  // Re-render visible pages when notes change
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return
    for (const pageNum of renderedPagesRef.current) {
      const placeholder = containerRef.current.querySelector(
        `[data-page-number="${pageNum}"]`,
      )
      if (!placeholder) continue
      renderedPagesRef.current.delete(pageNum)
      renderedPagesRef.current.add(pageNum)
      renderPage(pageNum, placeholder)
    }
  }, [notes, pdfDoc, renderPage])

  return (
    <div className="w-full h-dvh bg-white text-(--q-text)">
      <div className="p-2 h-full flex flex-col">
        <div className="mb-2 flex flex-wrap gap-4 items-center">
          <span className="text-sm">
            {numPages > 0 ? `${numPages} pages` : 'No PDF loaded'}
          </span>
          <Button onClick={() => setScale(scale + 0.25)} variant="ghost">
            Zoom In
          </Button>
          <Button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            variant="ghost"
          >
            Zoom Out
          </Button>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto rounded-md p-4 bg-gray-100"
          style={{ touchAction: 'none' }}
        >
          <div ref={containerRef} />
        </div>
      </div>

      {ringState.visible && (
        <LongPressRing
          x={ringState.x}
          y={ringState.y}
          progress={ringState.progress}
        />
      )}

      <PromptDialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        title="Create Note"
        label="Note name"
        placeholder="Enter note name"
        confirmText="Create"
        onConfirm={handleNoteSubmit}
      />
    </div>
  )
}
