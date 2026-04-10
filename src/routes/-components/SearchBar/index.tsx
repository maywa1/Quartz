import { useId, forwardRef, useState, useImperativeHandle, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import './SearchBar.css'

export interface SearchBarProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export interface SearchBarHandle {
  focus: () => void
}

export const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(
  function SearchBarInner(
    {
      value: controlledValue,
      onChange,
      placeholder = 'Search notes and PDFs…',
      className,
      autoFocus,
    },
    ref,
  ) {
    const [internalValue, setInternalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : internalValue

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }))

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const next = e.target.value
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    }

    function handleClear() {
      if (!isControlled) setInternalValue('')
      onChange?.('')
    }

    const id = useId()
    const hasValue = value.length > 0

    return (
      <div
        className={cn(
          'q-search',
          isFocused && 'q-search--focused',
          hasValue && 'q-search--has-value',
          className,
        )}
      >
        <Search
          className="q-search__icon"
          size={18}
          strokeWidth={1.75}
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          id={id}
          type="text"
          className="q-search__input"
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              inputRef.current?.blur()
            }
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label="Search notes"
        />

        {hasValue && (
          <button
            type="button"
            className="q-search__clear"
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}

        {/* Keyboard hint — only visible when empty and unfocused */}
        {!hasValue && !isFocused && <kbd className="q-search__kbd">⌘K</kbd>}
      </div>
    )
  },
)
