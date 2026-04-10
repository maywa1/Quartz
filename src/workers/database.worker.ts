import { DatabaseController } from '#/lib/database/DatabaseController'

interface InitPayload {
  dbName?: string
}

interface QueryPayload {
  repository: string
  method: string
  args: unknown[]
  id: number
}

interface ImportPayload {
  data: Parameters<DatabaseController['importExport']['importAll']>[0]
}

type WorkerMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'query'; payload: QueryPayload }
  | { type: 'export' }
  | { type: 'import'; payload: ImportPayload }

let dbController: DatabaseController | null = null

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data

  if (type === 'init') {
    const payload = event.data.payload
    if (dbController) return
    try {
      dbController = await DatabaseController.initialize(
        payload.dbName || 'app.db',
      )
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', error: (err as Error).message })
    }
  }

  if (type === 'query' && dbController) {
    const payload = event.data.payload
    const { repository, method, args, id } = payload
    console.log('Worker received query:', repository, method, args)
    try {
      // @ts-expect-error - dynamic property access on repository
      const result = await dbController[repository][method](...args)
      console.log('Worker query result:', result)
      self.postMessage({ type: 'queryResult', result, id })
    } catch (err) {
      console.error('Worker query error:', err)
      self.postMessage({
        type: 'queryError',
        error: (err as Error).message,
        id,
      })
    }
  }

  if (type === 'export') {
    if (!dbController) {
      self.postMessage({
        type: 'exportError',
        error: 'Database not initialized',
      })
      return
    }
    try {
      const data = await dbController.importExport.exportAll()
      self.postMessage({ type: 'exportResult', result: data })
    } catch (err) {
      console.error('Worker export error:', err)
      self.postMessage({
        type: 'exportError',
        error: (err as Error).message,
      })
    }
  }

  if (type === 'import') {
    if (!dbController) {
      self.postMessage({
        type: 'importError',
        error: 'Database not initialized',
      })
      return
    }
    const payload = event.data.payload
    try {
      await dbController.importExport.importAll(payload.data)
      self.postMessage({ type: 'importResult' })
    } catch (err) {
      console.error('Worker import error:', err)
      self.postMessage({
        type: 'importError',
        error: (err as Error).message,
      })
    }
  }
}
