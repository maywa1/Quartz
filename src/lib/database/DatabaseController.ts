import { Database } from './Database'
import { PdfRepository } from './repositories/PdfRepository'
import { NoteRepository } from './repositories/NoteRepository'
import { TagRepository } from './repositories/TagRepository'
import { SettingsRepository } from './repositories/SettingsRepository'
import type { Statistics } from '#/types/types'

export class DatabaseController {
  private static instance: DatabaseController

  readonly pdfs: PdfRepository
  readonly notes: NoteRepository
  readonly tags: TagRepository
  readonly settings: SettingsRepository

  private constructor(private readonly db: Database) {
    this.pdfs = new PdfRepository(db)
    this.notes = new NoteRepository(db)
    this.tags = new TagRepository(db)
    this.settings = new SettingsRepository(db)
  }

  static async initialize(dbName = 'app.db'): Promise<DatabaseController> {
    if (DatabaseController.instance) {
      return DatabaseController.instance
    }

    const db = new Database(dbName)
    await db.open()

    DatabaseController.instance = new DatabaseController(db)
    await DatabaseController.instance.initializeTables()

    return DatabaseController.instance
  }

  static getInstance(): DatabaseController {
    if (!DatabaseController.instance) {
      throw new Error('DatabaseController not initialized. Call initialize() first.')
    }
    return DatabaseController.instance
  }

  async getStatistics(): Promise<Statistics> {
    const [stats] = await this.db.all<{
      totalPdfs: number
      totalNotes: number
      viewLaterCount: number
    }>(`
      SELECT
        (SELECT COUNT(*) FROM pdfs) as totalPdfs,
        (SELECT COUNT(*) FROM notes) as totalNotes,
        (SELECT COUNT(*) FROM notes WHERE view_later = 1) as viewLaterCount
    `)

    const recentlyOpenedPdfs = await this.pdfs.findRecentlyOpened(5)

    return {
      totalPdfs: stats.totalPdfs,
      totalNotes: stats.totalNotes,
      viewLaterCount: stats.viewLaterCount,
      recentlyOpenedPdfs,
    }
  }

  async close(): Promise<void> {
    await this.db.close()
  }

  private async initializeTables(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL UNIQUE,
        last_opened DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL DEFAULT '',
        view_later INTEGER NOT NULL DEFAULT 0,
        pdf_coordinate_x REAL,
        pdf_coordinate_y REAL,
        pdf_page INTEGER,
        pdf_id INTEGER,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notes_pdf_id ON notes(pdf_id);
      CREATE INDEX IF NOT EXISTS idx_notes_view_later ON notes(view_later);
      CREATE INDEX IF NOT EXISTS idx_pdfs_name ON pdfs(name);
    `)
  }
}
