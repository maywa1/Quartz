import * as SQLite from 'wa-sqlite'
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs'
import { OriginPrivateFileSystemVFS } from 'wa-sqlite/src/examples/OriginPrivateFileSystemVFS.js'

export interface RunResult {
  lastID: number
  changes: number
}

export class Database {
  private sqlite3: SQLiteAPI | null = null
  private db: number | null = null
  private dbName: string

  constructor(dbName: string) {
    this.dbName = dbName
  }

  async open(): Promise<void> {
    console.log('Starting SQLiteESMFactory...')
    const module = await SQLiteESMFactory({
      locateFile: (file: string) => `/${file}`,
    })
    console.log('SQLite module loaded')

    this.sqlite3 = SQLite.Factory(module)
    console.log('SQLite Factory created')

    const vfs = new OriginPrivateFileSystemVFS()
    // @ts-ignore
    this.sqlite3.vfs_register(vfs, true)
    console.log('OPFS VFS registered')

    console.log('Opening database...')
    this.db = await this.sqlite3.open_v2(this.dbName)
    console.log('Database connected:', this.dbName)
  }

  async close(): Promise<void> {
    this.assertOpen()
    await this.sqlite3!.close(this.db!)
    this.db = null
    this.sqlite3 = null
  }

  async run(
    sql: string,
    params: SQLiteCompatibleType[] = [],
  ): Promise<RunResult> {
    this.assertOpen()
    let changes = 0

    for await (const stmt of this.sqlite3!.statements(this.db!, sql)) {
      this.sqlite3!.bind_collection(stmt, params)
      while ((await this.sqlite3!.step(stmt)) === SQLite.SQLITE_ROW) {
        // run() discards rows; drain to completion
      }
      changes = this.sqlite3!.changes(this.db!)
    }

    // wa-sqlite has no last_insert_rowid() API method — query it directly
    const row = await this.get<{ 'last_insert_rowid()': number }>(
      'SELECT last_insert_rowid()',
    )
    const lastID = row?.['last_insert_rowid()'] ?? 0

    return { lastID, changes }
  }

  async get<T = any>(
    sql: string,
    params: SQLiteCompatibleType[] = [],
  ): Promise<T | undefined> {
    this.assertOpen()
    let result: T | undefined

    for await (const stmt of this.sqlite3!.statements(this.db!, sql)) {
      this.sqlite3!.bind_collection(stmt, params)

      if ((await this.sqlite3!.step(stmt)) === SQLite.SQLITE_ROW) {
        result = this.rowToObject<T>(stmt)
      }
      // Only the first row is returned — remaining rows are discarded
    }

    return result
  }

  async all<T = any>(
    sql: string,
    params: SQLiteCompatibleType[] = [],
  ): Promise<T[]> {
    this.assertOpen()
    const rows: T[] = []

    for await (const stmt of this.sqlite3!.statements(this.db!, sql)) {
      this.sqlite3!.bind_collection(stmt, params)

      while ((await this.sqlite3!.step(stmt)) === SQLite.SQLITE_ROW) {
        rows.push(this.rowToObject<T>(stmt))
      }
    }

    return rows
  }

  async exec(sql: string): Promise<void> {
    this.assertOpen()
    for await (const stmt of this.sqlite3!.statements(this.db!, sql)) {
      while ((await this.sqlite3!.step(stmt)) === SQLite.SQLITE_ROW) {
        // drain rows
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private assertOpen(): void {
    if (!this.db || !this.sqlite3) {
      throw new Error('Database is not open')
    }
  }

  private rowToObject<T>(stmt: number): T {
    const obj: Record<string, SQLiteCompatibleType> = {}
    const count = this.sqlite3!.column_count(stmt)

    for (let i = 0; i < count; i++) {
      const name = this.sqlite3!.column_name(stmt, i)
      obj[name] = this.sqlite3!.column(stmt, i)
    }

    return obj as T
  }
}
