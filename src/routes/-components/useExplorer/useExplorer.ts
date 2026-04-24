import type { Note, Tag, PDF } from '#/types/types'

export interface NoteWithTags extends Note {
  tags: Tag[]
}
export interface PdfWithTags extends PDF {
  tags: Tag[]
}
