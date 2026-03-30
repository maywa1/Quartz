import { createContext, useContext } from 'react'
import type { ReactNode, Context } from 'react'
import type { DatabaseController } from '#/lib/database/DatabaseController'

interface DatabaseContextValue {
  db: DatabaseController
}

const DatabaseContext: Context<DatabaseContextValue | undefined> =
  createContext<DatabaseContextValue | undefined>(undefined)

interface DatabaseProviderProps {
  db: DatabaseController
  children: ReactNode
}

export function DatabaseProvider({ db, children }: DatabaseProviderProps) {
  return (
    <DatabaseContext.Provider value={{ db }}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase(): DatabaseController {
  const context = useContext(DatabaseContext)

  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }

  return context.db
}

export { DatabaseContext }
