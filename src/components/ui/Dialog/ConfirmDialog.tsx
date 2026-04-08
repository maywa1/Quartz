import { Dialog } from './Dialog'
import { Button } from '../Button'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  important?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  important = false,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-(--q-text)">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            style={
              important
                ? { background: 'var(--q-error)', color: '#fff' }
                : undefined
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
