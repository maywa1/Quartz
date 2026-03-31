import type { PDF } from '#/types/types'
import { BaseRepository } from './BaseRepository'

export class PdfRepository extends BaseRepository {
  async create(name: string): Promise<string> {
    const id = crypto.randomUUID()
    const fileName = `${id}.pdf`
    await this.db.run(
      'INSERT INTO pdfs (id, name, file_name) VALUES (?, ?, ?)',
      [id, name, fileName],
    )
    return id
  }

  async findById(id: string): Promise<PDF | undefined> {
    return this.db.get<PDF>('SELECT * FROM pdfs WHERE id = ?', [id])
  }

  async findByPath(filePath: string): Promise<PDF | undefined> {
    return this.db.get<PDF>('SELECT * FROM pdfs WHERE file_name = ?', [
      filePath,
    ])
  }

  async findAll(
    sortBy: 'name' | 'created_at' | 'last_opened' = 'created_at',
  ): Promise<PDF[]> {
    const order =
      sortBy === 'name'
        ? 'name ASC'
        : sortBy === 'last_opened'
          ? 'last_opened DESC'
          : 'created_at DESC'
    return this.db.all<PDF>(`SELECT * FROM pdfs ORDER BY ${order}`)
  }

  async findAllWithNoteCounts(): Promise<Array<PDF & { note_count: number }>> {
    return this.db.all<PDF & { note_count: number }>(`
      SELECT p.*, COUNT(n.id) as note_count
      FROM pdfs p
      LEFT JOIN notes n ON p.id = n.pdf_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)
  }

  async search(query: string): Promise<PDF[]> {
    return this.db.all<PDF>(
      'SELECT * FROM pdfs WHERE name LIKE ? ORDER BY created_at DESC',
      [`%${query}%`],
    )
  }

  async update(
    id: string,
    updates: Partial<Omit<PDF, 'id' | 'created_at'>>,
  ): Promise<void> {
    const entries = Object.entries(updates)
    if (entries.length === 0) return

    const fields = entries.map(([key]) => `${key} = ?`).join(', ')
    const values = entries.map(([, value]) => value)

    await this.db.run(`UPDATE pdfs SET ${fields} WHERE id = ?`, [...values, id])
  }

  async touchLastOpened(id: string): Promise<void> {
    await this.db.run(
      'UPDATE pdfs SET last_opened = CURRENT_TIMESTAMP WHERE id = ?',
      [id],
    )
  }

  async delete(id: string): Promise<void> {
    await this.db.run('DELETE FROM pdfs WHERE id = ?', [id])
  }

  async findRecentlyOpened(limit = 5): Promise<PDF[]> {
    return this.db.all<PDF>(
      'SELECT * FROM pdfs WHERE last_opened IS NOT NULL ORDER BY last_opened DESC LIMIT ?',
      [limit],
    )
  }

  async findByTag(tagId: string): Promise<PDF[]> {
    return this.db.all<PDF>(
      `SELECT p.* FROM pdfs p
       INNER JOIN tag_pdfs tp ON p.id = tp.pdf_id
       WHERE tp.tag_id = ?`,
      [tagId],
    )
  }
}
