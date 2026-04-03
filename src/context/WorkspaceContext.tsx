import { createContext, useContext, useState, type ReactNode } from 'react'

export type PageType = 'explorer' | 'workspace'

interface WorkspaceContextType {
  activeNoteId: string | null
  setActiveNoteId: (id: string | null) => void

  activePdfId: string | null
  setActivePdfId: (id: string | null) => void

  initialPage: number | undefined
  setInitialPage: (page: number | undefined) => void
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
)

interface WorkspaceProviderProps {
  children: ReactNode
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activePdfId, setActivePdfId] = useState<string | null>(null)
  const [initialPage, setInitialPage] = useState<number | undefined>()

  return (
    <WorkspaceContext.Provider
      value={{
        activeNoteId,
        setActiveNoteId,
        activePdfId,
        setActivePdfId,
        initialPage,
        setInitialPage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
