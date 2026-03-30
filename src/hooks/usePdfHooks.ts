import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PDF } from '#/types/types'
import { useDatabase } from './providers'
import { queryKeys } from './queryKeys'

type PdfSortBy = 'name' | 'created_at' | 'last_opened'

export function usePdfs(sortBy: PdfSortBy = 'created_at') {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.list(sortBy),
    queryFn: () => db.pdfs.findAll(sortBy),
  })
}

export function usePdfsWithCounts() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.withCounts,
    queryFn: () => db.pdfs.findAllWithNoteCounts(),
  })
}

export function useRecentlyOpenedPdfs(limit = 5) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.recentlyOpened(limit),
    queryFn: () => db.pdfs.findRecentlyOpened(limit),
  })
}

export function usePdf(id: number) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.detail(id),
    queryFn: () => db.pdfs.findById(id),
  })
}

export function usePdfByPath(filePath: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.byPath(filePath),
    queryFn: () => db.pdfs.findByPath(filePath),
  })
}

export function useSearchPdfs(query: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.pdfs.search(query),
    queryFn: () => db.pdfs.search(query),
    enabled: query.length > 0,
  })
}

export interface CreatePdfParams {
  name: string
  filePath: string
}

export interface UpdatePdfParams {
  id: number
  updates: Partial<Omit<PDF, 'id' | 'created_at'>>
}

export function useCreatePdf() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, filePath }: CreatePdfParams) =>
      db.pdfs.create(name, filePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfs.all })
    },
  })
}

export function useUpdatePdf() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: UpdatePdfParams) =>
      db.pdfs.update(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfs.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfs.detail(id) })
    },
  })
}

export function useDeletePdf() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => db.pdfs.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfs.all })
    },
  })
}

export function useTouchLastOpened() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => db.pdfs.touchLastOpened(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pdfs.detail(id) })
      queryClient.invalidateQueries({
        queryKey: queryKeys.pdfs.recentlyOpened(),
      })
    },
  })
}
