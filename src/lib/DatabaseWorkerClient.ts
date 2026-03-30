type PendingQuery = {
  resolve: (val: any) => void
  reject: (err: any) => void
}

export class DatabaseWorkerClient {
  private worker: Worker
  private queryId = 0
  private pendingQueries = new Map<number, PendingQuery>()

  constructor() {
    this.worker = new Worker(
      new URL('../workers/database.worker.ts?worker', import.meta.url),
      { type: 'module' },
    )
    this.worker.onmessage = (event) => {
      const { type, result, error, id } = event.data
      if (type === 'ready') {
        this.readyResolver?.()
      }
      if (type === 'error') {
        this.readyRejecter?.(new Error(error))
      }
      if (type === 'queryResult') {
        const pending = this.pendingQueries.get(id)
        pending?.resolve(result)
        this.pendingQueries.delete(id)
      }
      if (type === 'queryError') {
        const pending = this.pendingQueries.get(id)
        pending?.reject(new Error(error))
        this.pendingQueries.delete(id)
      }
    }
  }

  private readyResolver?: () => void
  private readyRejecter?: (err: any) => void

  async init(dbName?: string) {
    return new Promise<void>((resolve, reject) => {
      this.readyResolver = resolve
      this.readyRejecter = reject
      this.worker.postMessage({ type: 'init', payload: { dbName } })
    })
  }

  async query(method: string, ...args: any[]) {
    const id = this.queryId++
    return new Promise((resolve, reject) => {
      this.pendingQueries.set(id, { resolve, reject })
      this.worker.postMessage({ type: 'query', payload: { method, args, id } })
    })
  }
}
