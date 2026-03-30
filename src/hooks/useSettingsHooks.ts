import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDatabase } from './providers'
import { queryKeys } from './queryKeys'

export function useSetting(key: string) {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.settings.key(key),
    queryFn: () => db.settings.get(key),
  })
}

export function useSettings() {
  const db = useDatabase()

  return useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => db.settings.getAll(),
  })
}

export function useSetSetting() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      db.settings.set(key, value),
    onSuccess: (_, { key }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.key(key) })
    },
  })
}

export function useDeleteSetting() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (key: string) => db.settings.delete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    },
  })
}
