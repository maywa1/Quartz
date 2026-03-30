import { useQuery } from '@tanstack/react-query'
import type { Statistics } from '#/types/types'
import { useDatabase } from './providers'
import { queryKeys } from './queryKeys'

export function useStatistics() {
  const db = useDatabase()

  return useQuery<Statistics>({
    queryKey: queryKeys.statistics,
    queryFn: () => db.getStatistics(),
  })
}
