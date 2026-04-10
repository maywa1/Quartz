import { BaseRepository } from './BaseRepository'
import type { PDF, Note, Tag } from '#/types/types'

interface TagNoteRow {
  tag_id: string
  note_id: string
}

interface TagPdfRow {
  tag_id: string
  pdf_id: string
}

interface SettingRow {
  key: string
  value: string
}

interface DatabaseDump {
  pdfs: PDF[]
  notes: Note[]
  tags: Tag[]
  tagNotes: TagNoteRow[]
  tagPdfs: TagPdfRow[]
  settings: SettingRow[]
}

export class ImportExportRepository extends BaseRepository {
  async exportAll(): Promise<DatabaseDump> {
    const [pdfs, notes, tags, tagNotes, tagPdfs, settings] = await Promise.all([
      this.db.all<PDF>('SELECT * FROM pdfs'),
      this.db.all<Note>('SELECT * FROM notes'),
      this.db.all<Tag>('SELECT * FROM tags'),
      this.db.all<TagNoteRow>('SELECT * FROM tag_notes'),
      this.db.all<TagPdfRow>('SELECT * FROM tag_pdfs'),
      this.db.all<SettingRow>('SELECT * FROM settings'),
    ])

    return { pdfs, notes, tags, tagNotes, tagPdfs, settings }
  }

  async importAll(data: DatabaseDump): Promise<void> {
    await this.db.exec('PRAGMA foreign_keys = OFF')
    await this.db.exec('DELETE FROM tag_notes')
    await this.db.exec('DELETE FROM tag_pdfs')
    await this.db.exec('DELETE FROM notes')
    await this.db.exec('DELETE FROM tags')
    await this.db.exec('DELETE FROM pdfs')
    await this.db.exec('DELETE FROM settings')
    await this.db.exec('PRAGMA foreign_keys = ON')

    await this.bulkInsert('pdfs', data.pdfs as never[])
    await this.bulkInsert('notes', data.notes as never[])
    await this.bulkInsert('tags', data.tags as never[])
    await this.bulkInsert('tag_notes', data.tagNotes as never[])
    await this.bulkInsert('tag_pdfs', data.tagPdfs as never[])
    await this.bulkInsert('settings', data.settings as never[])
  }

  private async bulkInsert<T extends Record<string, unknown>>(
    tableName: string,
    rows: T[],
  ): Promise<void> {
    if (rows.length === 0) return

    const columns = Object.keys(rows[0])
    const placeholders = columns.map(() => '?').join(', ')
    const sql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`

    for (const row of rows) {
      const values: (string | number | null)[] = columns.map((col) => {
        const value = row[col]
        if (value === undefined || value === null) return null
        if (typeof value === 'string') return value
        if (typeof value === 'number') return value
        if (typeof value === 'boolean') return value ? 1 : 0
        return String(value)
      })
      await this.db.run(sql, values)
    }
  }
}
