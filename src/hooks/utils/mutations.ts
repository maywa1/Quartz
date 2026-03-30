import { useQueryClient } from '@tanstack/react-query'

export function useQueryInvalidator() {
  const queryClient = useQueryClient()

  return {
    invalidate: (queryKey: readonly unknown[]) =>
      queryClient.invalidateQueries({ queryKey }),
    invalidateAll: () => queryClient.invalidateQueries(),
  }
}

export async function optimisticUpdate<TData, TVariables>(config: {
  queryClient: ReturnType<typeof useQueryClient>
  queryKey: readonly unknown[]
  mutationFn: (variables: TVariables) => Promise<TData>
  variables: TVariables
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
}): Promise<TData> {
  const { queryClient, queryKey, mutationFn, variables, updateFn } = config

  queryClient.setQueryData(queryKey, (old: unknown) =>
    updateFn(old as TData | undefined, variables),
  )

  return mutationFn(variables)
}

export function rollbackUpdate<TData>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: readonly unknown[],
  previousData: TData | undefined,
) {
  queryClient.setQueryData(queryKey, previousData)
}
