import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { DatabaseContext } from './useDatabase'
import { DatabaseWorkerClient } from '#/lib/DatabaseWorkerClient'

interface DatabaseProviderProps {
  dbName?: string
  children: ReactNode
}

export function DatabaseProvider({ dbName, children }: DatabaseProviderProps) {
  const [workerClient, setWorkerClient] = useState<DatabaseWorkerClient | null>(
    null,
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const client = new DatabaseWorkerClient()
    ;(window as any).__db = client
    setWorkerClient(client)
    client.init(dbName).then(() => setReady(true))

    return () => {
      client.terminate()
    }
  }, [dbName])

  if (!ready || !workerClient) return null

  return (
    <DatabaseContext.Provider value={{ db: workerClient, ready }}>
      {children}
    </DatabaseContext.Provider>
  )
}
