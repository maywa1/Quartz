import { useState, useId } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { cn } from '../cn'
import './Tooltip.css'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  /** The tooltip text */
  content: string
  /** The element that triggers the tooltip */
  children: ReactNode
  placement?: TooltipPlacement
  className?: string
  style?: CSSProperties
}

/**
 * Tooltip — a lightweight CSS-driven tooltip that appears on hover/focus.
 *
 * @example
 * <Tooltip content="Insert formula">
 *   <Button variant="icon" aria-label="Insert formula">Σ</Button>
 * </Tooltip>
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  className,
  style,
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const id = useId()

  return (
    <div
      className={cn('q-tooltip-wrap', className)}
      style={style}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}
      <div
        id={id}
        role="tooltip"
        aria-hidden={!visible}
        className={cn(
          'q-tooltip',
          `q-tooltip--${placement}`,
          visible && 'q-tooltip--visible',
        )}
      >
        {content}
      </div>
    </div>
  )
}
