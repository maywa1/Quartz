import type { Note, PDF, Tag, Statistics } from '../types/types'
import type { ImportExportRepository } from './database/repositories/ImportExportRepository'

type PendingQuery = {
  resolve: (val: unknown) => void
  reject: (err: Error) => void
}

interface DatabaseClientInterface {
  pdfs: {
    create: (name: string) => Promise<string>
    findById: (id: string) => Promise<PDF | undefined>
    findByPath: (filePath: string) => Promise<PDF | undefined>
    findAll: (sortBy?: 'name' | 'created_at' | 'last_opened') => Promise<PDF[]>
    findAllWithNoteCounts: () => Promise<Array<PDF & { note_count: number }>>
    findByTag: (tagId: string) => Promise<PDF[]>
    search: (query: string) => Promise<PDF[]>
    update: (
      id: string,
      updates: Partial<Omit<PDF, 'id' | 'created_at'>>,
    ) => Promise<void>
    touchLastOpened: (id: string) => Promise<void>
    delete: (id: string) => Promise<void>
    findRecentlyOpened: (limit?: number) => Promise<PDF[]>
  }
  notes: {
    create: (
      name: string,
      pdfId: string | null,
      coordinates?: { x?: number; y?: number; page?: number },
    ) => Promise<string>
    findById: (id: string) => Promise<Note | undefined>
    findByPdf: (pdfId: string) => Promise<Note[]>
    findAll: () => Promise<Note[]>
    findViewLater: () => Promise<Note[]>
    findByTag: (tagId: string) => Promise<Note[]>
    search: (query: string) => Promise<Note[]>
    update: (
      id: string,
      updates: Partial<Omit<Note, 'id' | 'created_at' | 'pdf_id'>>,
    ) => Promise<void>
    toggleViewLater: (id: string) => Promise<void>
    delete: (id: string) => Promise<void>
    countByPdf: (pdfId: string) => Promise<number>
    countViewLater: () => Promise<number>
  }
  tags: {
    create: (name: string) => Promise<string>
    findById: (id: string) => Promise<Tag | undefined>
    findByName: (name: string) => Promise<Tag | undefined>
    findAll: () => Promise<Tag[]>
    update: (id: string, name: string) => Promise<void>
    delete: (id: string) => Promise<void>
    addTagToNote: (tagId: string, noteId: string) => Promise<void>
    removeTagFromNote: (tagId: string, noteId: string) => Promise<void>
    getTagsForNote: (noteId: string) => Promise<Tag[]>
    getNotesForTag: (tagId: string) => Promise<string[]>
    addTagToPdf: (tagId: string, pdfId: string) => Promise<void>
    removeTagFromPdf: (tagId: string, pdfId: string) => Promise<void>
    getTagsForPdf: (pdfId: string) => Promise<Tag[]>
    getPdfsForTag: (tagId: string) => Promise<string[]>
    getAllNoteTags: () => Promise<Record<string, Tag[]>>
    getAllPdfTags: () => Promise<Record<string, Tag[]>>
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
  private readyRejecter?: (err: Error) => void

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
      if (type === 'exportResult') {
        const pending = this.pendingQueries.get(-1)
        pending?.resolve(result)
        this.pendingQueries.delete(-1)
      }
      if (type === 'exportError') {
        const pending = this.pendingQueries.get(-1)
        pending?.reject(new Error(error))
        this.pendingQueries.delete(-1)
      }
      if (type === 'importResult') {
        const pending = this.pendingQueries.get(-2)
        pending?.resolve(undefined)
        this.pendingQueries.delete(-2)
      }
      if (type === 'importError') {
        const pending = this.pendingQueries.get(-2)
        pending?.reject(new Error(error))
        this.pendingQueries.delete(-2)
      }
    }

    this.pdfs = this.createRepositoryProxy('pdfs')
    this.notes = this.createRepositoryProxy('notes')
    this.tags = this.createRepositoryProxy('tags')
    this.settings = this.createRepositoryProxy('settings')
  }

  private createRepositoryProxy(repository: string) {
    return new Proxy({} as any, {
      get: (_, method: string) => {
        return (...args: any[]) => this.query(repository, method, ...args)
      },
    })
  }

  async query(repository: string, method: string, ...args: any[]) {
    console.log('DB Client query:', repository, method, args)
    const id = this.queryId++
    return new Promise((resolve, reject) => {
      this.pendingQueries.set(id, { resolve, reject })
      this.worker.postMessage({
        type: 'query',
        payload: { repository, method, args, id },
      })
    })
  }

  getStatistics(): Promise<Statistics> {
    return this.query('db', 'getStatistics') as Promise<Statistics>
  }

  terminate(): void {
    this.worker.terminate()
  }

  async init(dbName?: string) {
    return new Promise<void>((resolve, reject) => {
      this.readyResolver = resolve
      this.readyRejecter = reject
      this.worker.postMessage({ type: 'init', payload: { dbName } })
    })
  }

  async exportData(): Promise<
    Awaited<ReturnType<ImportExportRepository['exportAll']>>
  > {
    return new Promise((resolve, reject) => {
      this.pendingQueries.set(-1, {
        resolve: resolve as (val: unknown) => void,
        reject,
      })
      this.worker.postMessage({ type: 'export' })
    })
  }

  async importData(
    data: Parameters<ImportExportRepository['importAll']>[0],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pendingQueries.set(-2, {
        resolve: resolve as (val: unknown) => void,
        reject,
      })
      this.worker.postMessage({ type: 'import', payload: { data } })
    })
  }
}
