import type { Database } from '../Database'

export abstract class BaseRepository {
  constructor(protected readonly db: Database) {}
}
