import type { Note } from '#/types/types'
import { BaseRepository } from './BaseRepository'
import { FileStorage } from '#/lib/FileStorage'


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
    pdfId: string,
    coordinates?: NoteCoordinates,
  ): Promise<string> {
    const id = crypto.randomUUID()
    const fileName = FileStorage.buildNotePath(id)
    await this.db.run(
      `INSERT INTO notes (id, name, file_name, pdf_id, pdf_coordinate_x, pdf_coordinate_y, pdf_page)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        fileName,
        pdfId,
        coordinates?.x ?? null,
        coordinates?.y ?? null,
        coordinates?.page ?? null,
      ],
    )
    return id
  }

  async findById(id: string): Promise<Note | undefined> {
    return this.db.get<Note>('SELECT * FROM notes WHERE id = ?', [id])
  }

  async findByPdf(pdfId: string): Promise<Note[]> {
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

  async search(query: string): Promise<Note[]> {
    return this.db.all<Note>(
      'SELECT * FROM notes WHERE name LIKE ? OR file_name LIKE ? ORDER BY created_at DESC',
      [`%${query}%`, `%${query}%`],
    )
  }

  async update(
    id: string,
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

  async toggleViewLater(id: string): Promise<void> {
    await this.db.run(
      'UPDATE notes SET view_later = NOT view_later, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
    )
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM tag_notes WHERE note_id = ?', [id])
    await this.db.run('DELETE FROM notes WHERE id = ?', [id])
  }

  async deleteAll(): Promise<void> {
    await this.db.run('DELETE FROM tag_notes')
    await this.db.run('DELETE FROM notes')
  }

  async countByPdf(pdfId: string): Promise<number> {
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

  async findByTag(tagId: string): Promise<Note[]> {
    return this.db.all<Note>(
      `SELECT n.* FROM notes n
       INNER JOIN tag_notes tn ON n.id = tn.note_id
       WHERE tn.tag_id = ?`,
      [tagId],
    )
  }
}
