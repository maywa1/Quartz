import { useId, forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "../cn";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  /** Provide options as data instead of children */
  options?: SelectOption[];
}

/**
 * Select — native `<select>` with Quartz styling.
 *
 * Pass options as `options` prop or as `<option>` children.
 *
 * @example
 * <Select
 *   label="Topic"
 *   options={[
 *     { value: "calculus", label: "Calculus" },
 *     { value: "algebra", label: "Linear Algebra" },
 *   ]}
 * />
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, options, children, className, id: externalId, ...rest },
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
        <select
          ref={ref}
          id={id}
          className={cn("q-select", error && "q-input--error")}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          aria-invalid={error ? true : undefined}
          {...rest}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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
