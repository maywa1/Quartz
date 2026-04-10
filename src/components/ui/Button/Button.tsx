import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ButtonVariant, Size } from '../types'
import { cn } from '../cn'
import './Button.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style */
  variant?: ButtonVariant
  /** Size preset */
  size?: Size
  /** Show a loading spinner and disable interaction */
  loading?: boolean
  /** Icon to render before the label */
  leftIcon?: ReactNode
  /** Icon to render after the label */
  rightIcon?: ReactNode
  children?: ReactNode
}

/**
 * Button — the primary interactive element in Quartz.
 *
 * @example
 * <Button variant="primary">New Note</Button>
 * <Button variant="secondary" size="sm">Export</Button>
 * <Button variant="ghost">Cancel</Button>
 * <Button variant="icon" aria-label="Add formula">
 *   <PlusIcon />
 * </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        'q-btn',
        `q-btn--${variant}`,
        `q-btn--${size}`,
        loading && 'q-btn--loading',
        className,
      )}
      disabled={disabled ?? loading}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span className="q-btn__spinner" aria-hidden="true" />
      ) : (
        leftIcon && <span className="q-btn__icon">{leftIcon}</span>
      )}
      {children && <span className="q-btn__label">{children}</span>}
      {!loading && rightIcon && (
        <span className="q-btn__icon">{rightIcon}</span>
      )}
    </button>
  )
}
