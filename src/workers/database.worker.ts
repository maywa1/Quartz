import { DatabaseController } from '#/lib/database/DatabaseController'

interface WorkerMessage {
  type: 'init' | 'query'
  payload?: any
}

let dbController: DatabaseController | null = null

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data

  if (type === 'init') {
    if (dbController) return
    try {
      dbController = await DatabaseController.initialize(
        payload?.dbName || 'app.db',
      )
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({ type: 'error', error: (err as Error).message })
    }
  }

  if (type === 'query' && dbController) {
    const { repository, method, args, id } = payload
    console.log('Worker received query:', repository, method, args)
    try {
      // @ts-ignore
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
}
