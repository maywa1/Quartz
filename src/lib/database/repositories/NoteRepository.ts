import type { Note } from '#/types/types'
import { BaseRepository } from './BaseRepository'

type SQLiteCompatibleType = string | number | null

function toSqlValue(value: unknown): SQLiteCompatibleType {
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  return value as SQLiteCompatibleType
}

export interface NoteCoordinates {
  x?: number
  y?: number
  page?: number
}

export class NoteRepository extends BaseRepository {
  async create(
    name: string,
    pdfId: number,
    fileName = '',
    coordinates?: NoteCoordinates,
  ): Promise<number> {
    const result = await this.db.run(
      `INSERT INTO notes (name, file_name, pdf_id, pdf_coordinate_x, pdf_coordinate_y, pdf_page)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        fileName,
        pdfId,
        coordinates?.x ?? null,
        coordinates?.y ?? null,
        coordinates?.page ?? null,
      ],
    )
    return result.lastID
  }

  async findById(id: number): Promise<Note | undefined> {
    return this.db.get<Note>('SELECT * FROM notes WHERE id = ?', [id])
  }

  async findByPdf(pdfId: number): Promise<Note[]> {
    return this.db.all<Note>(
      'SELECT * FROM notes WHERE pdf_id = ? ORDER BY created_at DESC',
      [pdfId],
    )
  }

  async findAll(): Promise<Note[]> {
    return this.db.all<Note>('SELECT * FROM notes ORDER BY created_at DESC')
  }

  async findViewLater(): Promise<Note[]> {
    return this.db.all<Note>(
      'SELECT * FROM notes WHERE view_later = 1 ORDER BY created_at DESC',
    )
  }

  async findByTag(tag: string): Promise<Note[]> {
    return this.db.all<Note>(
      'SELECT * FROM notes WHERE tags LIKE ? ORDER BY created_at DESC',
      [`%${tag}%`],
    )
  }

  async search(query: string): Promise<Note[]> {
    return this.db.all<Note>(
      'SELECT * FROM notes WHERE name LIKE ? OR file_name LIKE ? ORDER BY created_at DESC',
      [`%${query}%`, `%${query}%`],
    )
  }

  async update(
    id: number,
    updates: Partial<Omit<Note, 'id' | 'created_at' | 'pdf_id'>>,
  ): Promise<void> {
    const entries = Object.entries(updates)
    if (entries.length === 0) return

    const fields = entries.map(([key]) => `${key} = ?`).join(', ')
    const values = entries.map(([, value]) => toSqlValue(value))

    await this.db.run(
      `UPDATE notes SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id],
    )
  }

  async toggleViewLater(id: number): Promise<void> {
    await this.db.run(
      'UPDATE notes SET view_later = NOT view_later, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
    )
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM notes WHERE id = ?', [id])
  }

  async countByPdf(pdfId: number): Promise<number> {
    const row = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE pdf_id = ?',
      [pdfId],
    )
    return row?.count ?? 0
  }

  async countViewLater(): Promise<number> {
    const row = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE view_later = 1',
    )
    return row?.count ?? 0
  }
}
