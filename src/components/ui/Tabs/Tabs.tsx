import { useState, useId } from 'react'
import type { ReactNode, CSSProperties, KeyboardEvent } from 'react'
import { cn } from '../cn'
import './Tabs.css'

export interface TabItem {
  label: string
  content: ReactNode
  /** Disable this individual tab */
  disabled?: boolean
}

export interface TabsProps {
  tabs: TabItem[]
  /** Controlled active index */
  activeIndex?: number
  /** Callback when tab changes */
  onChange?: (index: number) => void
  /** Default active tab for uncontrolled usage */
  defaultIndex?: number
  className?: string
  style?: CSSProperties
}

/**
 * Tabs — segmented tab switcher with panel content.
 *
 * Can be used controlled or uncontrolled.
 *
 * @example
 * // Uncontrolled
 * <Tabs tabs={[
 *   { label: "Notes", content: <NotesPanel /> },
 *   { label: "Formulas", content: <FormulasPanel /> },
 *   { label: "Practice", content: <PracticePanel /> },
 * ]} />
 *
 * // Controlled
 * const [tab, setTab] = useState(0);
 * <Tabs tabs={tabs} activeIndex={tab} onChange={setTab} />
 */
export function Tabs({
  tabs,
  activeIndex: controlledIndex,
  onChange,
  defaultIndex = 0,
  className,
  style,
}: TabsProps) {
  const [internalIndex, setInternalIndex] = useState(defaultIndex)
  const isControlled = controlledIndex !== undefined
  const active = isControlled ? controlledIndex : internalIndex
  const baseId = useId()

  function select(index: number) {
    if (tabs[index]?.disabled) return
    if (!isControlled) setInternalIndex(index)
    onChange?.(index)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLElement>, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (index + 1) % tabs.length
      select(next)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (index - 1 + tabs.length) % tabs.length
      select(prev)
    } else if (e.key === 'Home') {
      e.preventDefault()
      select(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      select(tabs.length - 1)
    }
  }

  return (
    <div className={cn('q-tabs-root', className)} style={style}>
      <div className="q-tabs" role="tablist">
        {tabs.map((tab, i) => {
          const tabId = `${baseId}-tab-${i}`
          const panelId = `${baseId}-panel-${i}`
          return (
            <button
              key={i}
              id={tabId}
              role="tab"
              aria-selected={active === i}
              aria-controls={panelId}
              aria-disabled={tab.disabled}
              tabIndex={active === i ? 0 : -1}
              className={cn(
                'q-tab',
                active === i && 'q-tab--active',
                tab.disabled && 'q-tab--disabled',
              )}
              onClick={() => select(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {tabs.map((tab, i) => {
        const tabId = `${baseId}-tab-${i}`
        const panelId = `${baseId}-panel-${i}`
        return (
          <div
            key={i}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={active !== i}
            className="q-tab-panel"
          >
            {tab.content}
          </div>
        )
      })}
    </div>
  )
}
