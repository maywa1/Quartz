import { cn } from '#/components/ui/cn'

export interface SettingsNavItem {
  id: string
  label: string
  icon: React.ReactNode
}

interface SettingsNavProps {
  items: SettingsNavItem[]
  activeId: string
  onSelect: (id: string) => void
}

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  return (
    <nav aria-label="Settings navigation">
      <ul className="flex flex-col gap-0.5" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => onSelect(item.id)}
              aria-current={activeId === item.id ? 'page' : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-(--q-transition) outline-none',
                activeId === item.id
                  ? 'text-(--q-green-deep)'
                  : 'text-(--q-text-muted) hover:bg-(--q-green-lite) hover:text-(--q-green-deep)',
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0 w-4 h-4',
                  activeId === item.id
                    ? 'text-(--q-green-deep)'
                    : 'text-(--q-text-muted)',
                )}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
