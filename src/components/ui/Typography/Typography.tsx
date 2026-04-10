import type { ElementType, ReactNode, CSSProperties } from 'react'
import { cn } from '../cn'
import './Typography.css'

// ── Text ─────────────────────────────────────────────────────

export type TextVariant =
  | 'display'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'mono'
  | 'caption'

const VARIANT_TAG: Record<TextVariant, ElementType> = {
  display: 'h1',
  heading: 'h2',
  subheading: 'p',
  body: 'p',
  mono: 'code',
  caption: 'span',
}

export interface TextProps {
  variant?: TextVariant
  /** Override the rendered HTML element */
  as?: ElementType
  children: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * Text — polymorphic typography component covering all Quartz text styles.
 *
 * @example
 * <Text variant="display">Quartz</Text>
 * <Text variant="heading" as="h3">Euler's Identity</Text>
 * <Text variant="body">If f is continuous on [a, b]…</Text>
 * <Text variant="mono">∇²φ = ∂²φ/∂x²</Text>
 * <Text variant="caption">Last edited · Mar 25</Text>
 */
export function Text({
  variant = 'body',
  as,
  children,
  className,
  style,
}: TextProps) {
  const Tag = as ?? VARIANT_TAG[variant]
  return (
    <Tag className={cn(`q-text q-text--${variant}`, className)} style={style}>
      {children}
    </Tag>
  )
}

// ── Divider ──────────────────────────────────────────────────

export interface DividerProps {
  className?: string
  style?: CSSProperties
}

/**
 * Divider — a thin horizontal rule using the Quartz border colour.
 *
 * @example
 * <Divider />
 */
export function Divider({ className, style }: DividerProps) {
  return (
    <hr
      className={cn('q-divider', className)}
      style={style}
      aria-hidden="true"
    />
  )
}
