export const queryKeys = {
  all: ['data'] as const,

  pdfs: {
    all: ['data', 'pdfs'] as const,
    list: (sortBy?: 'name' | 'created_at' | 'last_opened') =>
      ['data', 'pdfs', 'list', { sortBy }] as const,
    withCounts: ['data', 'pdfs', 'withCounts'] as const,
    recentlyOpened: (limit?: number) =>
      ['data', 'pdfs', 'recentlyOpened', limit] as const,
    search: (query: string) => ['data', 'pdfs', 'search', query] as const,
    detail: (id: string) => ['data', 'pdfs', 'detail', id] as const,
    byPath: (path: string) => ['data', 'pdfs', 'byPath', path] as const,
    byTag: (tagId: string) => ['data', 'pdfs', 'byTag', tagId] as const,
  },

  notes: {
    all: ['data', 'notes'] as const,
    list: ['data', 'notes', 'list'] as const,
    byPdf: (pdfId: string) => ['data', 'notes', 'byPdf', pdfId] as const,
    viewLater: ['data', 'notes', 'viewLater'] as const,
    byTag: (tagId: string) => ['data', 'notes', 'byTag', tagId] as const,
    search: (query: string) => ['data', 'notes', 'search', query] as const,
    detail: (id: string) => ['data', 'notes', 'detail', id] as const,
    count: {
      byPdf: (pdfId: string) =>
        ['data', 'notes', 'count', 'byPdf', pdfId] as const,
      viewLater: ['data', 'notes', 'count', 'viewLater'] as const,
    },
  },

  tags: {
    all: ['data', 'tags'] as const,
    list: ['data', 'tags', 'list'] as const,
    detail: (id: string) => ['data', 'tags', 'detail', id] as const,
    byName: (name: string) => ['data', 'tags', 'byName', name] as const,
    forNote: (noteId: string) => ['data', 'tags', 'forNote', noteId] as const,
    forPdf: (pdfId: string) => ['data', 'tags', 'forPdf', pdfId] as const,
    allNoteTags: ['data', 'tags', 'allNoteTags'] as const,
    allPdfTags: ['data', 'tags', 'allPdfTags'] as const,
  },

  settings: {
    all: ['data', 'settings'] as const,
    key: (key: string) => ['data', 'settings', 'key', key] as const,
  },

  statistics: ['data', 'statistics'] as const,
} as const

export type QueryKeys = typeof queryKeys
