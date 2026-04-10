import type { Tag } from '#/types/types'
import { BaseRepository } from './BaseRepository'

export class TagRepository extends BaseRepository {
  async create(name: string): Promise<string> {
    const id = crypto.randomUUID()
    await this.db.run('INSERT INTO tags (id, name) VALUES (?, ?)', [id, name])
    return id
  }

  async findById(id: string): Promise<Tag | undefined> {
    return this.db.get<Tag>('SELECT * FROM tags WHERE id = ?', [id])
  }

  async findByName(name: string): Promise<Tag | undefined> {
    return this.db.get<Tag>('SELECT * FROM tags WHERE name = ?', [name])
  }

  async findAll(): Promise<Tag[]> {
    return this.db.all<Tag>('SELECT * FROM tags ORDER BY name')
  }

  async update(id: string, name: string): Promise<void> {
    await this.db.run('UPDATE tags SET name = ? WHERE id = ?', [name, id])
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM tag_notes WHERE tag_id = ?', [id])
    await this.db.run('DELETE FROM tag_pdfs WHERE tag_id = ?', [id])
    await this.db.run('DELETE FROM tags WHERE id = ?', [id])
  }

  async deleteAll(): Promise<void> {
    await this.db.run('DELETE FROM tag_notes')
    await this.db.run('DELETE FROM tag_pdfs')
    await this.db.run('DELETE FROM tags')
  }

  async addTagToNote(tagId: string, noteId: string): Promise<void> {
    await this.db.run(
      'INSERT OR IGNORE INTO tag_notes (tag_id, note_id) VALUES (?, ?)',
      [tagId, noteId],
    )
  }

  async removeTagFromNote(tagId: string, noteId: string): Promise<void> {
    await this.db.run(
      'DELETE FROM tag_notes WHERE tag_id = ? AND note_id = ?',
      [tagId, noteId],
    )
  }

  async getTagsForNote(noteId: string): Promise<Tag[]> {
    return this.db.all<Tag>(
      `SELECT t.* FROM tags t
INNER JOIN tag_notes tn ON t.id = tn.tag_id
WHERE tn.note_id = ?`,
      [noteId],
    )
  }

  async getNotesForTag(tagId: string): Promise<string[]> {
    const rows = await this.db.all<{ note_id: string }>(
      'SELECT note_id FROM tag_notes WHERE tag_id = ?',
      [tagId],
    )
    return rows.map((r) => r.note_id)
  }

  async addTagToPdf(tagId: string, pdfId: string): Promise<void> {
    await this.db.run(
      'INSERT OR IGNORE INTO tag_pdfs (tag_id, pdf_id) VALUES (?, ?)',
      [tagId, pdfId],
    )
  }

  async removeTagFromPdf(tagId: string, pdfId: string): Promise<void> {
    await this.db.run('DELETE FROM tag_pdfs WHERE tag_id = ? AND pdf_id = ?', [
      tagId,
      pdfId,
    ])
  }

  async getTagsForPdf(pdfId: string): Promise<Tag[]> {
    return this.db.all<Tag>(
      `SELECT t.* FROM tags t
INNER JOIN tag_pdfs tp ON t.id = tp.tag_id
WHERE tp.pdf_id = ?`,
      [pdfId],
    )
  }

  async getPdfsForTag(tagId: string): Promise<string[]> {
    const rows = await this.db.all<{ pdf_id: string }>(
      'SELECT pdf_id FROM tag_pdfs WHERE tag_id = ?',
      [tagId],
    )
    return rows.map((r) => r.pdf_id)
  }

  async getAllNoteTags(): Promise<Record<string, Tag[]>> {
    const rows = await this.db.all<{
      note_id: string
      tag_id: string
      name: string
      created_at: string
    }>(
      `SELECT tn.note_id, t.id as tag_id, t.name, t.created_at
FROM tag_notes tn
INNER JOIN tags t ON t.id = tn.tag_id`,
    )
    const result: Record<string, Tag[]> = {}
    for (const row of rows) {
      const tag: Tag = {
        id: row.tag_id,
        name: row.name,
        created_at: row.created_at,
      }
      if (!result[row.note_id]) result[row.note_id] = []
      result[row.note_id].push(tag)
    }
    return result
  }

  async getAllPdfTags(): Promise<Record<string, Tag[]>> {
    const rows = await this.db.all<{
      pdf_id: string
      tag_id: string
      name: string
      created_at: string
    }>(
      `SELECT tp.pdf_id, t.id as tag_id, t.name, t.created_at
FROM tag_pdfs tp
INNER JOIN tags t ON t.id = tp.tag_id`,
    )
    const result: Record<string, Tag[]> = {}
    for (const row of rows) {
      const tag: Tag = {
        id: row.tag_id,
        name: row.name,
        created_at: row.created_at,
      }
      if (!result[row.pdf_id]) result[row.pdf_id] = []
      result[row.pdf_id].push(tag)
    }
    return result
  }
}
