import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDatabase } from '#/providers'
import { queryKeys } from './queryKeys'

export function useTags() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.list,
    queryFn: () => db.tags.findAll(),
  })
}

export function useTag(id: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => db.tags.findById(id),
  })
}

export function useTagByName(name: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.byName(name),
    queryFn: () => db.tags.findByName(name),
    enabled: name.length > 0,
  })
}

export function useTagsForNote(noteId: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.forNote(noteId),
    queryFn: () => db.tags.getTagsForNote(noteId),
  })
}

export function useTagsForPdf(pdfId: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.forPdf(pdfId),
    queryFn: () => db.tags.getTagsForPdf(pdfId),
  })
}

export function useCreateTag() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => db.tags.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })
}

export function useUpdateTag() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      db.tags.update(id, name),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.detail(id) })
    },
  })
}

export function useDeleteTag() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => db.tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })
}

export function useAddTagToNote() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, noteId }: { tagId: string; noteId: string }) =>
      db.tags.addTagToNote(tagId, noteId),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.forNote(noteId),
      })
    },
  })
}

export function useRemoveTagFromNote() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, noteId }: { tagId: string; noteId: string }) =>
      db.tags.removeTagFromNote(tagId, noteId),
    onSuccess: (_, { noteId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tags.forNote(noteId),
      })
    },
  })
}

export function useAddTagToPdf() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, pdfId }: { tagId: string; pdfId: string }) =>
      db.tags.addTagToPdf(tagId, pdfId),
    onSuccess: (_, { pdfId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.forPdf(pdfId) })
    },
  })
}

export function useRemoveTagFromPdf() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tagId, pdfId }: { tagId: string; pdfId: string }) =>
      db.tags.removeTagFromPdf(tagId, pdfId),
    onSuccess: (_, { pdfId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.forPdf(pdfId) })
    },
  })
}

export function useAllNoteTags() {
  const db = useDatabase()
  return useQuery({
    queryKey: queryKeys.tags.allNoteTags,
    queryFn: async () => {
      const obj = await db.tags.getAllNoteTags()
      return new Map(Object.entries(obj))
    },
  })
}
export function useAllPdfTags() {
  const db = useDatabase()
  return useQuery({
    queryKey: queryKeys.tags.allPdfTags,
    queryFn: async () => {
      const obj = await db.tags.getAllPdfTags()
      return new Map(Object.entries(obj))
    },
  })
}
