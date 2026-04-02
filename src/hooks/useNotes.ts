import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Note } from '#/types/types'
import { useDatabase } from '#/providers'
import { queryKeys } from './queryKeys'
import { FileStorage, DEFAULT_EXCALIDRAW_CONTENT } from '#/lib/FileStorage'

export interface CreateNoteParams {
  name: string
  pdfId: string | null
  coordinates?: {
    x?: number
    y?: number
    page?: number
  }
}

export interface UpdateNoteParams {
  id: string
  updates: Partial<Omit<Note, 'id' | 'created_at' | 'pdf_id'>>
}

export function useNotes() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.list,
    queryFn: () => db.notes.findAll(),
  })
}

export function useNotesByPdf(pdfId: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.byPdf(pdfId),
    queryFn: () => db.notes.findByPdf(pdfId),
  })
}

export function useViewLaterNotes() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.viewLater,
    queryFn: () => db.notes.findViewLater(),
  })
}

export function useNotesByTag(tagId: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.byTag(tagId),
    queryFn: () => db.notes.findByTag(tagId),
    enabled: tagId.length > 0,
  })
}

export function useSearchNotes(query: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.search(query),
    queryFn: () => db.notes.search(query),
    enabled: query.length > 0,
  })
}

export function useNote(id: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn: () => db.notes.findById(id),
  })
}

export function useNoteCountByPdf(pdfId: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.count.byPdf(pdfId),
    queryFn: () => db.notes.countByPdf(pdfId),
  })
}

export function useViewLaterCount() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.notes.count.viewLater,
    queryFn: () => db.notes.countViewLater(),
  })
}

export function useCreateNote() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, pdfId, coordinates }: CreateNoteParams) => {
      const id = await db.notes.create(name, pdfId, coordinates)

      const path = FileStorage.buildNotePath(id)
      await FileStorage.write(path, DEFAULT_EXCALIDRAW_CONTENT)

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.list })
    },
  })
}

export function useUpdateNote() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: UpdateNoteParams) =>
      db.notes.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) })
    },
  })
}

export function useDeleteNote() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => db.notes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
    },
  })
}

export function useToggleViewLater() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => db.notes.toggleViewLater(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.viewLater })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notes.count.viewLater,
      })
    },
  })
}
