import { useState, useRef, useEffect } from 'react'

type MenuState = 'closed' | 'context' | 'tags'

interface MenuPosition {
  x: number
  y: number
}

export function useNoteItemMenu() {
  const [menuState, setMenuState] = useState<MenuState>('closed')
  const [position, setPosition] = useState<MenuPosition>({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (menuState === 'closed') return

    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuState('closed')
      }
    }

    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuState('closed')
    }

    document.addEventListener('click', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('click', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [menuState])

  function openContext(x: number, y: number) {
    setPosition({ x, y })
    setMenuState('context')
  }

  function openTags() {
    setMenuState('tags')
  }

  function close() {
    setMenuState('closed')
  }

  return {
    menuState,
    position,
    menuRef,
    openContext,
    openTags,
    close,
    isContextOpen: menuState === 'context',
    isTagsOpen: menuState === 'tags',
  }
}
