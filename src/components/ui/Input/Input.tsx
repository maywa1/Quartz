import { useId, forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "../cn";
import "./Input.css";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Visible label rendered above the input */
  label?: string;
  /** Helper text rendered below the input */
  hint?: string;
  /** Error message — when provided the input takes the error visual state */
  error?: string;
  /** Render text in monospace (useful for LaTeX / formula inputs) */
  mono?: boolean;
}

/**
 * Input — single-line text field with label, hint, and error states.
 *
 * Forwards the ref to the underlying `<input>`.
 *
 * @example
 * <Input label="Note title" placeholder="Fourier Transform Notes" />
 *
 * <Input
 *   label="Formula (LaTeX)"
 *   mono
 *   placeholder="\int_0^\infty e^{-x^2} dx"
 *   hint="Wrap in $...$ for inline, $$...$$ for display"
 * />
 *
 * <Input label="Expression" error="Unbalanced parentheses" value="f(x = " />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, hint, error, mono, className, id: externalId, ...rest },
    ref
  ) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;

    return (
      <div className={cn("q-input-wrap", className)}>
        {label && (
          <label htmlFor={id} className="q-input__label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "q-input",
            mono && "q-input--mono",
            error && "q-input--error"
          )}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error ? (
          <span id={errorId} className="q-input__hint q-input__hint--error" role="alert">
            {error}
          </span>
        ) : hint ? (
          <span id={hintId} className="q-input__hint">
            {hint}
          </span>
        ) : null}
      </div>
    );
  }
);
