import { Edit3, Tag, Trash2 } from 'lucide-react'
import { cn } from '#/components/ui/cn'

interface NoteItemMenuProps {
  position: { x: number; y: number }
  onRename: () => void
  onManageTags: () => void
  onDelete: () => void
  menuRef: React.RefObject<HTMLDivElement>
}

export function NoteItemMenu({
  position,
  onRename,
  onManageTags,
  onDelete,
  menuRef,
}: NoteItemMenuProps) {
  return (
    <div
      ref={menuRef}
      className="q-note-item__menu"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      <button
        className="q-note-item__menu-item"
        role="menuitem"
        onClick={onRename}
      >
        <Edit3 size={13} strokeWidth={1.75} />
        Rename
      </button>
      <button
        className="q-note-item__menu-item"
        role="menuitem"
        onClick={onManageTags}
      >
        <Tag size={13} strokeWidth={1.75} />
        Manage Tags
      </button>
      <div className="q-note-item__menu-divider" />
      <button
        className={cn(
          'q-note-item__menu-item',
          'q-note-item__menu-item--danger',
        )}
        role="menuitem"
        onClick={onDelete}
      >
        <Trash2 size={13} strokeWidth={1.75} />
        Delete
      </button>
    </div>
  )
}
