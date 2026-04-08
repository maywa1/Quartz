import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Notebook, Map } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useNotesByPdf, useCreateNote } from '#/hooks'
import { FileStorage } from '#/lib/FileStorage'
import { useWorkspace } from '#/context/WorkspaceContext'
import { Dialog } from '#/components/ui/Dialog/Dialog'
import { Input } from '#/components/ui/Input/Input'
import { Button } from '#/components/ui/Button/Button'
import type { PDF, Note } from '#/types/types'

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
  const navigate = useNavigate()
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

  const isDraggingRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const scrollStartRef = useRef({ x: 0, y: 0 })
  const lastMoveTimeRef = useRef(0)
  const velocityRef = useRef({ x: 0, y: 0 })
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  const menuItems = useMemo(
    () => [
      {
        icon: Notebook,
        label: 'Create Note',
        action: () => {
          if (!noteCoordinates) return
          setShowNoteDialog(true)
        },
      },
      {
        icon: Map,
        label: 'View Projects',
        action: () => navigate({ to: '/' }),
      },
    ],
    [noteCoordinates, navigate],
  )

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const exists = document.querySelector('.fixed.z-50')
      const menuVisible = !!exists

      if (menuVisible && !isMenuVisible) {
        isDraggingRef.current = false
      }

      setIsMenuVisible(menuVisible)
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [isMenuVisible])

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

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return

    const currentTime = Date.now()
    const deltaTime = currentTime - lastMoveTimeRef.current
    const deltaX = startPosRef.current.x - e.clientX
    const deltaY = startPosRef.current.y - e.clientY

    if (deltaTime > 0) {
      velocityRef.current = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime,
      }
    }

    scrollContainerRef.current.scrollLeft = scrollStartRef.current.x + deltaX
    scrollContainerRef.current.scrollTop = scrollStartRef.current.y + deltaY
    lastMoveTimeRef.current = currentTime
  }, [])

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer || isMenuVisible) return

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
  }, [isMenuVisible, handlePointerDown, handlePointerMove, handlePointerUp])

  const handleCanvasClick = useCallback(
    async (e: MouseEvent, pageNum: number) => {
      if (isDraggingRef.current) return
      if (!pdfDoc) return

      const canvas = e.target as HTMLCanvasElement
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })

      const pdfX = x / scale
      const pdfY = (viewport.height - y) / scale

      const pageNotes = notesPerPageRef.current[pageNum]
      if (pageNotes) {
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
      }

      setNoteCoordinates({ x: pdfX, y: pdfY, page: pageNum })
    },
    [pdfDoc, scale, setActiveNoteId],
  )

  useEffect(() => {
    let isMounted = true

    const loadPdf = async () => {
      try {
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }
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

  useEffect(() => {
    const renderAllPages = async () => {
      if (!pdfDoc || !containerRef.current) return

      containerRef.current.innerHTML = ''
      notesPerPageRef.current = {}

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) continue

        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.className =
          'mb-4 mx-auto cursor-crosshair border border-gray-300'
        canvas.dataset.pageNumber = pageNum.toString()

        const clickHandler = (e: MouseEvent) => handleCanvasClick(e, pageNum)
        canvas.addEventListener('pointerdown', clickHandler)

        containerRef.current?.appendChild(canvas)

        await page.render({
          canvasContext: context,
          viewport,
          canvas,
        }).promise

        const pageNotes: Note[] = []
        notes.forEach((note) => {
          if (
            !note.pdf_coordinate_x ||
            !note.pdf_coordinate_y ||
            !note.pdf_page
          )
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

        if (initialPage && pageNum === initialPage) {
          requestAnimationFrame(() => {
            canvas.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        }
      }
    }

    renderAllPages()

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [pdfDoc, numPages, scale, handleCanvasClick, initialPage, notes])

  return (
    <PieMenuWrapper items={menuItems}>
      <div className="w-full h-dvh bg-white text-[var(--q-text)]">
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
      </div>

      <Dialog
        isOpen={showNoteDialog}
        onClose={() => setShowNoteDialog(false)}
        title="Create Note"
      >
        <NoteForm
          onSubmit={handleNoteSubmit}
          onCancel={() => setShowNoteDialog(false)}
        />
      </Dialog>
    </PieMenuWrapper>
  )
}

interface PieMenuWrapperProps {
  items: Array<{
    icon: React.ComponentType<{ className?: string }>
    label: string
    action: () => void
  }>
  children: React.ReactNode
}

function PieMenuWrapper({ items, children }: PieMenuWrapperProps) {
  const [menuState, setMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedIndex: null as number | null,
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mouseDownPosRef = useRef({ x: 0, y: 0 })
  const isHoldingRef = useRef(false)
  const hoveredIndexRef = useRef<number | null>(null)
  const selectedIndexRef = useRef<number | null>(null)
  const menuStateRef = useRef(menuState)

  const HOVER_RADIUS = 40
  const holdDuration = 400
  const movementThreshold = 5
  const radius = 110

  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex
  }, [hoveredIndex])

  useEffect(() => {
    menuStateRef.current = menuState
    selectedIndexRef.current = menuState.selectedIndex
  }, [menuState])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      mouseDownPosRef.current = { x: e.clientX, y: e.clientY }
      isHoldingRef.current = true

      holdTimerRef.current = setTimeout(() => {
        if (isHoldingRef.current) {
          setMenuState({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            selectedIndex: null,
          })
        }
      }, holdDuration)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isHoldingRef.current && !menuStateRef.current.visible) {
        const dx = e.clientX - mouseDownPosRef.current.x
        const dy = e.clientY - mouseDownPosRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > movementThreshold) {
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
          isHoldingRef.current = false
          return
        }
      }

      if (menuStateRef.current.visible) {
        const dx = e.clientX - menuStateRef.current.x
        const dy = e.clientY - menuStateRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        let foundHover = false
        for (let i = 0; i < items.length; i++) {
          const pos = getItemPosition(i, items.length, radius)
          const buttonX = menuStateRef.current.x + pos.x
          const buttonY = menuStateRef.current.y + pos.y
          const buttonDist = Math.sqrt(
            Math.pow(e.clientX - buttonX, 2) + Math.pow(e.clientY - buttonY, 2),
          )

          if (buttonDist <= HOVER_RADIUS) {
            setHoveredIndex(i)
            setMenuState((prev) => ({ ...prev, selectedIndex: null }))
            foundHover = true
            break
          }
        }

        if (!foundHover) {
          setHoveredIndex(null)
          if (distance > 40) {
            const angle = Math.atan2(dy, dx)
            const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2)
            const segmentAngle = (Math.PI * 2) / items.length
            const index =
              Math.floor((normalizedAngle + segmentAngle / 2) / segmentAngle) %
              items.length
            setMenuState((prev) => ({ ...prev, selectedIndex: index }))
          } else {
            setMenuState((prev) => ({ ...prev, selectedIndex: null }))
          }
        }
      }
    }

    const handleMouseUp = () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
      isHoldingRef.current = false

      if (menuStateRef.current.visible) {
        const hoveredIdx = hoveredIndexRef.current
        const selectedIdx = selectedIndexRef.current
        const indexToExecute = hoveredIdx !== null ? hoveredIdx : selectedIdx

        setMenuState({ visible: false, x: 0, y: 0, selectedIndex: null })
        setHoveredIndex(null)

        if (indexToExecute !== null) {
          items[indexToExecute].action()
        }
      }
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [items, holdDuration, movementThreshold, radius])

  const getItemPosition = (index: number, total: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {children}

      {menuState.visible && (
        <div
          className="fixed z-50"
          style={{
            left: menuState.x,
            top: menuState.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--q-green-deep)] rounded-full shadow-lg" />

          {items.map((item, index) => {
            const pos = getItemPosition(index, items.length, radius)
            const isSelected = menuState.selectedIndex === index
            const isHovered = hoveredIndex === index
            const IconComponent = item.icon

            return (
              <div
                key={index}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                }}
              >
                <div
                  className={`
                    relative flex items-center justify-center w-14 h-14 rounded-full
                    bg-[var(--q-green-pale)] border border-[var(--q-border)]
                    shadow-lg cursor-pointer
                    transition-all duration-200 ease-out
                    ${
                      isHovered
                        ? 'scale-110 bg-[var(--q-green-lite)] border-[var(--q-green-mid)] shadow-xl'
                        : isSelected
                          ? 'scale-105 bg-[var(--q-green-pale)] border-[var(--q-green-mid)]'
                          : 'hover:scale-105 hover:bg-[var(--q-green-lite)] hover:border-[var(--q-green-mid)]'
                    }
                  `}
                >
                  <IconComponent
                    className={`
                      w-5 h-5 transition-all duration-200
                      ${
                        isHovered
                          ? 'text-[var(--q-green-deep)] scale-110'
                          : isSelected
                            ? 'text-[var(--q-green-deep)]'
                            : 'text-[var(--q-green-deep)]'
                      }
                    `}
                  />
                </div>

                {(isHovered || isSelected) && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-10"
                    style={{
                      top: pos.y > 0 ? '100%' : 'auto',
                      bottom: pos.y <= 0 ? '100%' : 'auto',
                      marginTop: pos.y > 0 ? '8px' : '0',
                      marginBottom: pos.y <= 0 ? '8px' : '0',
                    }}
                  >
                    <div className="bg-[var(--q-bg)] border border-[var(--q-border)] px-3 py-1.5 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-sm font-medium text-[var(--q-text)]">
                        {item.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          <svg
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            width={radius * 2.2}
            height={radius * 2.2}
            style={{ opacity: 0.15 }}
          >
            {items.map((_, index) => {
              const pos = getItemPosition(index, items.length, radius)
              const center = radius * 1.1
              return (
                <line
                  key={index}
                  x1={center}
                  y1={center}
                  x2={center + pos.x}
                  y2={center + pos.y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-[var(--q-green-mid)]"
                />
              )
            })}
          </svg>

          <style>{`
            @keyframes fade-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes zoom-in-95 {
              from { transform: scale(0.95); }
              to { transform: scale(1); }
            }
            .animate-in {
              animation: fade-in 150ms ease-out, zoom-in-95 150ms ease-out;
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

interface NoteFormProps {
  onSubmit: (name: string) => void
  onCancel: () => void
}

function NoteForm({ onSubmit, onCancel }: NoteFormProps) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onSubmit(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Note name"
        placeholder="Enter note name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Create
        </Button>
      </div>
    </form>
  )
}
