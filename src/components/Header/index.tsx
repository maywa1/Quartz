import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Settings, Sun, Moon } from 'lucide-react'
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
        <Link to="/" className="q-header__logo-link">
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
        </Link>
      </div>

      <div className="q-header__actions">
        <Link
          to="/settings"
          className="q-header__settings"
          aria-label="Open settings"
        >
          <Settings size={18} />
        </Link>
        {/**/}
        {/* <button */}
        {/*   className="q-header__toggle" */}
        {/*   onClick={toggleTheme} */}
        {/*   aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} */}
        {/* > */}
        {/*   {isDark ? <Sun size={18} /> : <Moon size={18} />} */}
        {/* </button> */}
      </div>
    </header>
  )
}
