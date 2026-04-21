import { useState, useRef, useEffect, useCallback } from 'react'

type MenuState = 'closed' | 'context' | 'tags'

interface MenuPosition {
  x: number
  y: number
}

interface MenuDimensions {
  contextWidth: number
  contextHeight: number
  tagsWidth: number
  tagsHeight: number
}

let activeMenuId: string | null = null

function clampToScreen(
  x: number,
  y: number,
  width: number,
  height: number,
): MenuPosition {
  const padding = 8
  const maxX = window.innerWidth - width - padding
  const maxY = window.innerHeight - height - padding
  return {
    x: Math.min(Math.max(x, padding), maxX),
    y: Math.min(Math.max(y, padding), maxY),
  }
}

export function useNoteItemMenu(
  menuId: string,
  menuDimensions?: MenuDimensions,
) {
  const [menuState, setMenuState] = useState<MenuState>('closed')
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 })
  const [adjustedPosition, setAdjustedPosition] = useState<MenuPosition | null>(
    null,
  )
  const menuRef = useRef<HTMLDivElement>(null)
  const isMyMenuOpen = activeMenuId === menuId

  const close = useCallback(() => {
    setMenuState('closed')
    if (activeMenuId === menuId) {
      activeMenuId = null
    }
  }, [menuId])

  useEffect(() => {
    if (menuState === 'closed') return

    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuState, close])

  function openContext(x: number, y: number) {
    if (activeMenuId && activeMenuId !== menuId) {
      return
    }

    if (menuDimensions) {
      const adjusted = clampToScreen(
        x,
        y,
        menuDimensions.contextWidth,
        menuDimensions.contextHeight,
      )
      setAdjustedPosition(adjusted)
    } else {
      setAdjustedPosition(null)
    }

    setPosition({ x, y })
    setMenuState('context')
    activeMenuId = menuId
  }

  function openTags(x?: number, y?: number) {
    if (activeMenuId && activeMenuId !== menuId) {
      return
    }

    const targetX = x ?? position.x
    const targetY = y ?? position.y

    if (menuDimensions) {
      const adjusted = clampToScreen(
        targetX,
        targetY,
        menuDimensions.tagsWidth,
        menuDimensions.tagsHeight,
      )
      setAdjustedPosition(adjusted)
    } else {
      setAdjustedPosition(null)
    }

    setMenuState('tags')
    activeMenuId = menuId
  }

  return {
    menuState,
    position: adjustedPosition ?? position,
    menuRef,
    openContext,
    openTags,
    close,
    isContextOpen: menuState === 'context',
    isTagsOpen: menuState === 'tags',
    isMyMenuOpen,
  }
}
