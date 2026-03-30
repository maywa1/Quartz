import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDatabase } from './providers'
import { queryKeys } from './queryKeys'

export interface CreateTagParams {
  name: string
  color?: string
}

export interface UpdateTagParams {
  id: number
  name: string
  color?: string
}

export function useTags() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.list,
    queryFn: () => db.tags.findAll(),
  })
}

export function useTag(id: number) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.tags.detail(id),
    queryFn: () => db.tags.findById(id),
  })
}

export function useCreateTag() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, color }: CreateTagParams) =>
      db.tags.create(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })
}

export function useUpdateTag() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name, color }: UpdateTagParams) =>
      db.tags.update(id, name, color),
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
    mutationFn: (id: number) => db.tags.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    },
  })
}
