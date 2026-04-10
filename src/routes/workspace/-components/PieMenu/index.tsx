import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface PieMenuItem {
  icon: LucideIcon
  label: string
  action: () => void
}

interface PieMenuProps {
  items: PieMenuItem[]
  holdDuration?: number
  movementThreshold?: number
  radius?: number
  children?: React.ReactNode
  onVisibilityChange?: (visible: boolean) => void
}

interface MenuState {
  visible: boolean
  x: number
  y: number
  selectedIndex: number | null
}

export default function PieMenu({
  items,
  holdDuration = 400,
  movementThreshold = 5,
  radius = 110,
  children,
  onVisibilityChange,
}: PieMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>({
    visible: false,
    x: 0,
    y: 0,
    selectedIndex: null,
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

  // Keep refs in sync with state
  useEffect(() => {
    hoveredIndexRef.current = hoveredIndex
  }, [hoveredIndex])

  useEffect(() => {
    menuStateRef.current = menuState
    selectedIndexRef.current = menuState.selectedIndex

    // Notify parent about visibility changes
    if (onVisibilityChange) {
      onVisibilityChange(menuState.visible)
    }
  }, [menuState, onVisibilityChange])

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
      // Check for movement threshold only if menu is not visible yet
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

      // Handle menu interactions when visible
      if (menuStateRef.current.visible) {
        const dx = e.clientX - menuStateRef.current.x
        const dy = e.clientY - menuStateRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Check if hovering over any button (prioritize hover)
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
            // Clear selected index when hovering
            setMenuState((prev) => ({ ...prev, selectedIndex: null }))
            foundHover = true
            break
          }
        }

        // Only use angle-based selection if NOT hovering over a button
        if (!foundHover) {
          setHoveredIndex(null)

          // Selection based on angle
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
        // Capture the indices BEFORE resetting state
        const hoveredIdx = hoveredIndexRef.current
        const selectedIdx = selectedIndexRef.current

        // Prioritize hovered index (button click), fall back to selected index (directional)
        const indexToExecute = hoveredIdx !== null ? hoveredIdx : selectedIdx

        // Reset state
        setMenuState({ visible: false, x: 0, y: 0, selectedIndex: null })
        setHoveredIndex(null)

        // Execute action AFTER state reset
        if (indexToExecute !== null) {
          items[indexToExecute].action()
        }
      }
    }

    // Attach listeners to the container instead of window
    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove) // Keep on window for smooth tracking
    window.addEventListener('mouseup', handleMouseUp) // Keep on window to catch mouseup outside

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    }
  }, [items, holdDuration, movementThreshold, radius])

  const getItemPosition = (index: number, total: number, radiusVal: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2
    return {
      x: Math.cos(angle) * radiusVal,
      y: Math.sin(angle) * radiusVal,
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
          {/* Center dot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-neutral-700 rounded-full shadow-lg" />

          {/* Menu items */}
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
                {/* Item button */}
                <div
                  className={`
                    relative flex items-center justify-center w-14 h-14 rounded-full
                    bg-neutral-800 border border-neutral-700/50
                    shadow-lg cursor-pointer
                    transition-all duration-200 ease-out
                    ${
                      isHovered
                        ? 'scale-110 bg-neutral-100 border-neutral-300 shadow-xl shadow-neutral-100/20'
                        : isSelected
                          ? 'scale-105 bg-neutral-700 border-neutral-600'
                          : 'hover:scale-105 hover:bg-neutral-700 hover:border-neutral-600'
                    }
                  `}
                >
                  <IconComponent
                    className={`
                      w-5 h-5 transition-all duration-200
                      ${isHovered ? 'text-neutral-900 scale-110' : isSelected ? 'text-neutral-200' : 'text-neutral-300'}
                    `}
                    strokeWidth={2}
                  />
                </div>

                {/* Label tooltip */}
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
                    <div className="bg-neutral-900 border border-neutral-700/50 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-sm font-medium text-neutral-200">
                        {item.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Radial connection lines (decorative) */}
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
                  className="text-neutral-500"
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
