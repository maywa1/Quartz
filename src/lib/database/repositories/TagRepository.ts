import type { Tag } from '#/types/types'
import { BaseRepository } from './BaseRepository'

export class TagRepository extends BaseRepository {
  async create(name: string, color?: string): Promise<number> {
    const result = await this.db.run(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      [name, color ?? null]
    )
    return result.lastID
  }

  async findById(id: number): Promise<Tag | undefined> {
    return this.db.get<Tag>('SELECT * FROM tags WHERE id = ?', [id])
  }

  async findAll(): Promise<Tag[]> {
    return this.db.all<Tag>('SELECT * FROM tags ORDER BY name')
  }

  async update(id: number, name: string, color?: string): Promise<void> {
    await this.db.run(
      'UPDATE tags SET name = ?, color = ? WHERE id = ?',
      [name, color ?? null, id]
    )
  }

  async delete(id: number): Promise<void> {
    await this.db.run('DELETE FROM tags WHERE id = ?', [id])
  }
}
