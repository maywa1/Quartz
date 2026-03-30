import { useState } from 'react'
import { Text } from '../ui'
import { cn } from '../ui/cn'
import './Header.css'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)

  function toggleTheme() {
    const newTheme = !isDark
    setIsDark(newTheme)
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme ? 'dark' : 'light')
    document.documentElement.setAttribute(
      'data-theme',
      newTheme ? 'dark' : 'light',
    )
    document.documentElement.style.colorScheme = newTheme ? 'dark' : 'light'
  }

  return (
    <header className={cn('q-header', className)}>
      <div className="q-header__logo px-8">
        <svg
          className="q-header__logo-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
          <line x1="12" y1="22" x2="12" y2="15.5" />
          <polyline points="22 8.5 12 15.5 2 8.5" />
        </svg>
        <Text variant="heading" as="span">
          Quartz
        </Text>
      </div>

      <button
        className="q-header__toggle"
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </header>
  )
}
