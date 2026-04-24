import { useMemo } from 'react'
import type { Note, Tag, PDF } from '#/types/types'
import type { NoteWithTags, PdfWithTags } from './useExplorer'

export function useExplorerFilters(
  notes: Note[],
  pdfs: PDF[],
  noteTagsMap: Map<string, Tag[]>,
  pdfTagsMap: Map<string, Tag[]>,
  searchQuery: string,
  tagFilter: string[],
  viewLaterFilter: boolean,
) {
  const processedNotes = useMemo((): NoteWithTags[] => {
    const query = searchQuery.trim().toLowerCase()
    return notes
      .filter((n) => !n.pdf_id)
      .map((note) => ({ ...note, tags: noteTagsMap.get(note.id) ?? [] }))
      .filter(
        (note) =>
          matchesSearch(note, query) &&
          matchesTags(note.tags, tagFilter) &&
          matchesViewLater(note, viewLaterFilter),
      )
      .sort(sortByDate)
  }, [notes, noteTagsMap, searchQuery, tagFilter, viewLaterFilter])

  const processedPdfs = useMemo((): PdfWithTags[] => {
    const query = searchQuery.trim().toLowerCase()
    return pdfs
      .map((pdf) => ({ ...pdf, tags: pdfTagsMap.get(pdf.id) ?? [] }))
      .filter(
        (pdf) =>
          matchesSearchPdf(pdf, query) &&
          matchesTags(pdf.tags, tagFilter) &&
          matchesPdfViewLater(pdf.id, viewLaterFilter, notes),
      )
      .sort(sortByDate)
  }, [pdfs, pdfTagsMap, searchQuery, tagFilter, viewLaterFilter, notes])

  return { processedNotes, processedPdfs }
}

function matchesSearch(note: NoteWithTags, query: string): boolean {
  if (!query) return true
  if (note.name.toLowerCase().includes(query)) return true
  return note.tags.some((t) => t.name.toLowerCase().includes(query))
}

function matchesSearchPdf(pdf: PdfWithTags, query: string): boolean {
  if (!query) return true
  if (pdf.name.toLowerCase().includes(query)) return true
  return pdf.tags.some((t) => t.name.toLowerCase().includes(query))
}

function matchesTags(itemTags: Tag[], tagFilter: string[]): boolean {
  if (tagFilter.length === 0) return true
  return tagFilter.every((tagId) => itemTags.some((t) => t.id === tagId))
}

function matchesViewLater(
  note: NoteWithTags,
  viewLaterFilter: boolean,
): boolean {
  if (!viewLaterFilter) return true
  return note.view_later
}

function matchesPdfViewLater(
  pdfId: string,
  viewLaterFilter: boolean,
  notes: Note[],
): boolean {
  if (!viewLaterFilter) return true
  return notes.some((n) => n.pdf_id === pdfId && n.view_later)
}

function sortByDate(
  a: { created_at: string },
  b: { created_at: string },
): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}
