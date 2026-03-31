import type { Note, PDF, Tag, Statistics } from '../types/types'

type PendingQuery = {
  resolve: (val: any) => void
  reject: (err: any) => void
}

interface DatabaseClientInterface {
  pdfs: {
    create: (name: string, filePath: string) => Promise<number>
    findById: (id: number) => Promise<PDF | undefined>
    findByPath: (filePath: string) => Promise<PDF | undefined>
    findAll: (sortBy?: 'name' | 'created_at' | 'last_opened') => Promise<PDF[]>
    findAllWithNoteCounts: () => Promise<Array<PDF & { note_count: number }>>
    search: (query: string) => Promise<PDF[]>
    update: (
      id: number,
      updates: Partial<Omit<PDF, 'id' | 'created_at'>>,
    ) => Promise<void>
    touchLastOpened: (id: number) => Promise<void>
    delete: (id: number) => Promise<void>
    findRecentlyOpened: (limit?: number) => Promise<PDF[]>
  }
  notes: {
    create: (
      name: string,
      pdfId: number,
      fileName?: string,
      coordinates?: { x?: number; y?: number; page?: number },
    ) => Promise<number>
    findById: (id: number) => Promise<Note | undefined>
    findByPdf: (pdfId: number) => Promise<Note[]>
    findAll: () => Promise<Note[]>
    findViewLater: () => Promise<Note[]>
    findByTag: (tag: string) => Promise<Note[]>
    search: (query: string) => Promise<Note[]>
    update: (
      id: number,
      updates: Partial<Omit<Note, 'id' | 'created_at' | 'pdf_id'>>,
    ) => Promise<void>
    toggleViewLater: (id: number) => Promise<void>
    delete: (id: number) => Promise<void>
    countByPdf: (pdfId: number) => Promise<number>
    countViewLater: () => Promise<number>
  }
  tags: {
    create: (name: string, color?: string) => Promise<number>
    findById: (id: number) => Promise<Tag | undefined>
    findAll: () => Promise<Tag[]>
    update: (id: number, name: string, color?: string) => Promise<void>
    delete: (id: number) => Promise<void>
  }
  settings: {
    set: (key: string, value: string) => Promise<void>
    get: (key: string) => Promise<string | undefined>
    getAll: () => Promise<Record<string, string>>
    delete: (key: string) => Promise<void>
  }
  getStatistics: () => Promise<Statistics>
}

export class DatabaseWorkerClient implements DatabaseClientInterface {
  readonly pdfs: DatabaseClientInterface['pdfs']
  readonly notes: DatabaseClientInterface['notes']
  readonly tags: DatabaseClientInterface['tags']
  readonly settings: DatabaseClientInterface['settings']

  private worker: Worker
  private queryId = 0
  private pendingQueries = new Map<number, PendingQuery>()
  private readyResolver?: () => void
  private readyRejecter?: (err: any) => void

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

    this.pdfs = this.createRepositoryProxy('pdfs')
    this.notes = this.createRepositoryProxy('notes')
    this.tags = this.createRepositoryProxy('tags')
    this.settings = this.createRepositoryProxy('settings')
  }

  private createRepositoryProxy(name: string) {
    return new Proxy({} as any, {
      get: (_, method: string) => {
        return (...args: any[]) => this.query(name, method, ...args)
      },
    })
  }

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

  getStatistics(): Promise<Statistics> {
    return this.query('getStatistics') as Promise<Statistics>
  }
}
