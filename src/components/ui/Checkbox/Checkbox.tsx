import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../cn'
import './Checkbox.css'

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** Visible label rendered next to the checkbox */
  label?: string
  /** Apply strikethrough to label when checked */
  strikeOnCheck?: boolean
}

/**
 * Checkbox — accessible, styled checkbox with optional label.
 *
 * Fully controlled via `checked` + `onChange`, or uncontrolled via `defaultChecked`.
 *
 * @example
 * // Uncontrolled
 * <Checkbox label="Mark as understood" defaultChecked />
 *
 * // Controlled
 * const [done, setDone] = useState(false);
 * <Checkbox label="Ratio test" checked={done} onChange={e => setDone(e.target.checked)} />
 */
export function Checkbox({
  label,
  strikeOnCheck = true,
  className,
  id: externalId,
  checked,
  ...rest
}: CheckboxProps) {
  const autoId = useId()
  const id = externalId ?? autoId

  return (
    <div className={cn('q-checkbox-wrap', className)}>
      <div className="q-checkbox__control-wrap">
        <input
          id={id}
          type="checkbox"
          className="q-checkbox__input"
          checked={checked}
          {...rest}
        />
        <div className="q-checkbox__box" aria-hidden="true">
          <svg
            className="q-checkbox__check"
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 4l3 3 5-6"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'q-checkbox__label',
            strikeOnCheck && 'q-checkbox__label--strike-on-check',
          )}
        >
          {label}
        </label>
      )}
    </div>
  )
}
