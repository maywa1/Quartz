import { Database } from './Database'
import { PdfRepository } from './repositories/PdfRepository'
import { NoteRepository } from './repositories/NoteRepository'
import { TagRepository } from './repositories/TagRepository'
import { SettingsRepository } from './repositories/SettingsRepository'
import { ImportExportRepository } from './repositories/ImportExportRepository'
import { SCHEMA_VERSION } from '#/utils/config'
import type { Statistics } from '#/types/types'

export class DatabaseController {
  private static instance: DatabaseController

  readonly pdfs: PdfRepository
  readonly notes: NoteRepository
  readonly tags: TagRepository
  readonly settings: SettingsRepository
  readonly importExport: ImportExportRepository

  private constructor(private readonly db: Database) {
    this.pdfs = new PdfRepository(db)
    this.notes = new NoteRepository(db)
    this.tags = new TagRepository(db)
    this.settings = new SettingsRepository(db)
    this.importExport = new ImportExportRepository(db)
  }

  static async initialize(dbName = 'app.db'): Promise<DatabaseController> {
    if (DatabaseController.instance) {
      return DatabaseController.instance
    }

    const db = new Database(dbName)
    await db.open()

    DatabaseController.instance = new DatabaseController(db)
    await DatabaseController.instance.runMigrations()

    return DatabaseController.instance
  }

  static getInstance(): DatabaseController {
    if (!DatabaseController.instance) {
      throw new Error(
        'DatabaseController not initialized. Call initialize() first.',
      )
    }
    return DatabaseController.instance
  }

  getDb(): Database {
    return this.db
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

  private async runMigrations(): Promise<void> {
    await this.db.exec('PRAGMA foreign_keys = ON')

    const currentVersion = await this.db.get<{ user_version: number }>(
      'PRAGMA user_version',
    )
    const current = currentVersion?.user_version ?? 0

    if (current < SCHEMA_VERSION) {
      await this.initializeTables()
      await this.db.run(`PRAGMA user_version = ${SCHEMA_VERSION}`)
    }
  }

  private async initializeTables(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL UNIQUE,
        last_opened DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        file_name TEXT NOT NULL UNIQUE,
        view_later INTEGER NOT NULL DEFAULT 0,
        pdf_coordinate_x REAL,
        pdf_coordinate_y REAL,
        pdf_page INTEGER,
        pdf_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tag_notes (
        tag_id TEXT NOT NULL,
        note_id TEXT NOT NULL,
        PRIMARY KEY (tag_id, note_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tag_pdfs (
        tag_id TEXT NOT NULL,
        pdf_id TEXT NOT NULL,
        PRIMARY KEY (tag_id, pdf_id),
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notes_pdf_id ON notes(pdf_id);
      CREATE INDEX IF NOT EXISTS idx_notes_view_later ON notes(view_later);
      CREATE INDEX IF NOT EXISTS idx_pdfs_name ON pdfs(name);
      CREATE INDEX IF NOT EXISTS idx_tag_notes_note_id ON tag_notes(note_id);
      CREATE INDEX IF NOT EXISTS idx_tag_pdfs_pdf_id ON tag_pdfs(pdf_id);
    `)
  }
}
