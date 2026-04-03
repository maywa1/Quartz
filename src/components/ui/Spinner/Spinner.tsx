import { cn } from '../cn'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'q-spinner--sm',
  md: 'q-spinner--md',
  lg: 'q-spinner--lg',
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div className={cn('q-spinner', sizeClasses[size], className)}>
      <div className="q-spinner__dot" />
      <div className="q-spinner__dot" />
      <div className="q-spinner__dot" />
    </div>
  )
}

interface LoadingProps {
  text?: string
  className?: string
}

export function Loading({ text = 'Loading...', className }: LoadingProps) {
  return (
    <div className={cn('q-loading', className)}>
      <Spinner />
      {text && <span className="q-loading__text">{text}</span>}
    </div>
  )
}
