import { useState, useRef, useEffect } from 'react'
import { useUpdateNote, useUpdatePdf } from '#/hooks'

interface UseNoteItemEditOptions {
  id: string
  name: string
  isPdf: boolean
}

export function useNoteItemEdit({ id, name, isPdf }: UseNoteItemEditOptions) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  const updateNote = useUpdateNote()
  const updatePdf = useUpdatePdf()

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing) return
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') cancel()
    }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [editing])

  function start() {
    setEditName(name)
    setEditing(true)
  }

  function cancel() {
    setEditName(name)
    setEditing(false)
  }

  async function commit() {
    const trimmed = editName.trim()
    if (!trimmed || trimmed === name) { cancel(); return }
    try {
      if (isPdf) await updatePdf.mutateAsync({ id, updates: { name: trimmed } })
      else await updateNote.mutateAsync({ id, updates: { name: trimmed } })
    } catch { /* errors handled by mutation */ }
    setEditing(false)
  }

  return { editing, editName, setEditName, inputRef, start, cancel, commit }
}
