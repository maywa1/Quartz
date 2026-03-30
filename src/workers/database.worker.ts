import { DatabaseController } from '#/lib/database/DatabaseController'

interface WorkerMessage {
  type: 'init' | 'query'
  payload?: any
}

let dbController: DatabaseController | null = null

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  if (type === 'init') {
    try {
      dbController = await DatabaseController.initialize(payload?.dbName || 'app.db')
      // Tell main thread DB is ready
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', error: (err as Error).message })
    }
  }

  if (type === 'query' && dbController) {
    try {
      const { method, args } = payload
      // @ts-ignore
      const result = await dbController[method](...args)
      self.postMessage({ type: 'queryResult', result, id: payload.id })
    } catch (err) {
      self.postMessage({ type: 'queryError', error: (err as Error).message, id: payload.id })
    }
  }
}
