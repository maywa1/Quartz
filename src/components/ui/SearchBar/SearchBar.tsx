import { useId, forwardRef, useState } from 'react'
import { cn } from '../cn'
import './SearchBar.css'

export interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      value: controlledValue,
      onChange,
      placeholder = 'Search your notes... Ctrl + K',
      className,
      autoFocus,
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : internalValue

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const newValue = e.target.value
      if (!isControlled) setInternalValue(newValue)
      onChange?.(newValue)
    }

    const autoId = useId()

    return (
      <div className={cn('q-search', className)}>
        <div
          className={cn(
            'q-search__container',
            isFocused && 'q-search__container--focused',
          )}
        >
          <svg
            className="q-search__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={ref}
            id={autoId}
            type="text"
            className="q-search__input"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            aria-label="Search notes"
          />
        </div>
      </div>
    )
  },
)
