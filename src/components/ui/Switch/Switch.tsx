import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../cn'
import './Switch.css'

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> {
  /** Visible label rendered beside the toggle */
  label?: string
}

/**
 * Switch — accessible toggle backed by a hidden checkbox input.
 *
 * Fully controlled via `checked` + `onChange`, or uncontrolled via `defaultChecked`.
 *
 * @example
 * <Switch label="Auto-render LaTeX" defaultChecked />
 *
 * const [on, setOn] = useState(false);
 * <Switch label="Dark mode" checked={on} onChange={e => setOn(e.target.checked)} />
 */
export function Switch({
  label,
  className,
  id: externalId,
  ...rest
}: SwitchProps) {
  const autoId = useId()
  const id = externalId ?? autoId

  return (
    <div className={cn('q-switch-wrap', className)}>
      <div className="q-switch__control-wrap">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="q-switch__input"
          {...rest}
        />
        <div className="q-switch__track" aria-hidden="true">
          <div className="q-switch__thumb" />
        </div>
      </div>
      {label && (
        <label htmlFor={id} className="q-switch__label">
          {label}
        </label>
      )}
    </div>
  )
}
