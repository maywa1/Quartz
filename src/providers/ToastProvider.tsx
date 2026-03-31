import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

type MessageType = 'success' | 'error' | 'info'

interface Message {
  id: string
  type: MessageType
  message: string
}

interface ToastContextValue {
  showMessage: (type: MessageType, message: string) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string) => void
  removeMessage: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const showMessage = useCallback(
    (type: MessageType, message: string) => {
      const id = crypto.randomUUID()
      setMessages((prev) => [...prev, { id, type, message }])
      setTimeout(() => removeMessage(id), 4000)
    },
    [removeMessage],
  )

  const showSuccess = useCallback(
    (message: string) => {
      showMessage('success', message)
    },
    [showMessage],
  )

  const showError = useCallback(
    (message: string) => {
      showMessage('error', message)
    },
    [showMessage],
  )

  const showInfo = useCallback(
    (message: string) => {
      showMessage('info', message)
    },
    [showMessage],
  )

  return (
    <ToastContext.Provider
      value={{ showMessage, showSuccess, showError, showInfo, removeMessage }}
    >
      {children}
      <ToastContainer messages={messages} onDismiss={removeMessage} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  messages,
  onDismiss,
}: {
  messages: Message[]
  onDismiss: (id: string) => void
}) {
  if (messages.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        zIndex: 9999,
        maxWidth: '400px',
      }}
    >
      {messages.map((msg) => (
        <Toast key={msg.id} message={msg} onDismiss={() => onDismiss(msg.id)} />
      ))}
    </div>
  )
}

function Toast({
  message,
  onDismiss,
}: {
  message: Message
  onDismiss: () => void
}) {
  const colors = {
    success: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
    error: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  }

  const icons = {
    success: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  const style = colors[message.type]

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: '0.5rem',
        color: style.text,
        fontFamily: 'var(--q-font-sans, system-ui, sans-serif)',
        fontSize: '0.875rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        animation: 'slideIn 0.2s ease-out',
      }}
    >
      <span
        style={{ display: 'flex', alignItems: 'center', color: style.border }}
      >
        {icons[message.type]}
      </span>
      <span style={{ flex: 1 }}>{message.message}</span>
      <button
        onClick={onDismiss}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.25rem',
          background: 'transparent',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          color: style.text,
          opacity: 0.7,
        }}
        aria-label="Dismiss"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
