import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import type { BadgeVariant } from '../types'
import { cn } from '../cn'
import './Badge.css'

export interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: (e: MouseEvent<HTMLSpanElement>) => void
}

export function Badge({
  variant = 'green',
  children,
  className,
  style,
  onClick,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'q-badge',
        `q-badge--${variant}`,
        onClick && 'q-badge--clickable',
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
