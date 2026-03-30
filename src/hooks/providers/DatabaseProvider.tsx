// DatabaseProvider.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { DatabaseWorkerClient } from '#/lib/DatabaseWorkerClient'

interface DatabaseContextValue {
  db: DatabaseWorkerClient | null
  ready: boolean
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(undefined)

interface DatabaseProviderProps {
  dbName?: string
  children: ReactNode
}

export function DatabaseProvider({ dbName, children }: DatabaseProviderProps) {
  const [workerClient, setWorkerClient] = useState<DatabaseWorkerClient | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Only run in browser
    const client = new DatabaseWorkerClient()
    setWorkerClient(client)

    client.init(dbName).then(() => setReady(true))
  }, [dbName])

  return (
    <DatabaseContext.Provider value={{ db: workerClient, ready }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) throw new Error('useDatabase must be used within DatabaseProvider')
  return context
}
