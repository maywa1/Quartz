import { createContext, useContext } from 'react'
import type { DatabaseWorkerClient } from '#/lib/DatabaseWorkerClient'

interface DatabaseContextValue {
  db: DatabaseWorkerClient | null
  ready: boolean
}

const DatabaseContext = createContext<DatabaseContextValue | undefined>(
  undefined,
)

export function useDatabase(): DatabaseWorkerClient {
  const context = useContext(DatabaseContext)
  if (!context)
    throw new Error('useDatabase must be used within DatabaseProvider')
  if (!context.db) throw new Error('Database not initialized')
  return context.db
}

export { DatabaseContext }
