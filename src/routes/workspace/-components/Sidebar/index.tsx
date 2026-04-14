import { ArrowLeft } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export interface SidebarAction {
  id: string
  icon: LucideIcon
  label: string
  onClick: () => void
  variant?: 'default' | 'success' | 'danger'
  active?: boolean
}

interface SidebarProps {
  actions: SidebarAction[]
  onBack?: () => void
  backLabel?: string
}

export function Sidebar({ actions, onBack, backLabel = 'Back' }: SidebarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="w-14 border-r border-(--q-border) bg-(--q-bg) flex flex-col py-4">
      <button
        onClick={handleBack}
        className="group flex items-center justify-center w-10 h-10 mx-auto mb-2 text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale) rounded-md transition-colors relative"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
          {backLabel}
        </span>
      </button>

      {actions.map((action) => {
        const Icon = action.icon
        const isActive = action.active
        const isDanger = action.variant === 'danger'

        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`group flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-md transition-colors relative ${
              isActive
                ? 'text-(--q-green) bg-(--q-green-pale)'
                : isDanger
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale)'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
              {action.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
