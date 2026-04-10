import { useId, forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../cn'
import './Textarea.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
  mono?: boolean
}

/**
 * Textarea — multi-line text field with matching Input style & API.
 *
 * @example
 * <Textarea label="Notes" placeholder="Add context, derivations, references…" />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function TextareaInner(
    { label, hint, error, mono, className, id: externalId, ...rest },
    ref,
  ) {
    const autoId = useId()
    const id = externalId ?? autoId
    const hintId = `${id}-hint`
    const errorId = `${id}-error`

    return (
      <div className={cn('q-input-wrap', className)}>
        {label && (
          <label htmlFor={id} className="q-input__label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'q-input',
            'q-textarea',
            mono && 'q-input--mono',
            error && 'q-input--error',
          )}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error ? (
          <span
            id={errorId}
            className="q-input__hint q-input__hint--error"
            role="alert"
          >
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="q-input__hint">
            {hint}
          </span>
        ) : null}
      </div>
    )
  },
)
