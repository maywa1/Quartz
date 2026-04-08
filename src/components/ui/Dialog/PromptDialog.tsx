import { useEffect, useRef, useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '../Button'
import { Input } from '../Input'

interface PromptDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  defaultValue?: string
  placeholder?: string
  label?: string
  onConfirm: (value: string) => void
  confirmText?: string
  cancelText?: string
  important?: boolean
}

export function PromptDialog({
  isOpen,
  onClose,
  title,
  defaultValue = '',
  placeholder,
  label,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  important = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 0)
    }
  }, [isOpen, defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) {
      onConfirm(trimmed)
      onClose()
    }
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          label={label}
        />
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="submit"
            disabled={!value.trim()}
            style={
              important
                ? { background: 'var(--q-error)', color: '#fff' }
                : undefined
            }
          >
            {confirmText}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
