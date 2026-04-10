import { Link } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { Text } from '../ui'
import { cn } from '../ui/cn'
import './Header.css'
import { Logo } from '../Logo'

interface HeaderProps {
  className?: string
}

export default function Header({ className }: HeaderProps) {
  // const [isDark, setIsDark] = useState(false)

  // function toggleTheme() {
  //   const newTheme = !isDark
  //   setIsDark(newTheme)
  //   document.documentElement.classList.remove('light', 'dark')
  //   document.documentElement.classList.add(newTheme ? 'dark' : 'light')
  //   document.documentElement.setAttribute(
  //     'data-theme',
  //     newTheme ? 'dark' : 'light',
  //   )
  //   document.documentElement.style.colorScheme = newTheme ? 'dark' : 'light'
  // }
  //
  return (
    <header className={cn('q-header', className)}>
      <div className="q-header__logo px-8">
        <Link to="/" className="q-header__logo-link">
          <Logo className="w-8 h-8 text-(--q-green-mid)" />
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
