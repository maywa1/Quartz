import { BaseRepository } from './BaseRepository'

export class SettingsRepository extends BaseRepository {
  async set(key: string, value: string): Promise<void> {
    await this.db.run(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP`,
      [key, value, value]
    )
  }

  async get(key: string): Promise<string | undefined> {
    const row = await this.db.get<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    )
    return row?.value
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.all<{ key: string; value: string }>(
      'SELECT key, value FROM settings'
    )
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  }

  async delete(key: string): Promise<void> {
    await this.db.run('DELETE FROM settings WHERE key = ?', [key])
  }
}
