import type {
  UseQueryOptions,
  UseMutationOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/react-query'

export type Entity = { id: number }

export interface CreateEntityResult {
  id: number
}

export interface UpdateEntityResult {
  affected: number
}

export interface DeleteEntityResult {
  affected: number
}

export type ExtractFnReturnType<
  T extends (...args: never[]) => Promise<unknown>,
> = Awaited<ReturnType<T>>

export type QueryConfig<TData extends Entity, TError = Error> = Pick<
  UseQueryOptions<TData, TError, TData, QueryKey>,
  'enabled' | 'placeholderData' | 'refetchInterval' | 'select' | 'staleTime'
>

export type MutationConfig<TData, TError = Error, TVariables = void> = Pick<
  UseMutationOptions<TData, TError, TVariables>,
  'onError' | 'onMutate' | 'onSettled' | 'onSuccess'
>

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export function invalidateQueries(
  queryClient: QueryClient,
  keys: readonly unknown[],
) {
  return queryClient.invalidateQueries({ queryKey: keys })
}

export function setQueriesData<T>(
  queryClient: QueryClient,
  keys: readonly unknown[],
  data: T | ((old: T | undefined) => T),
) {
  return queryClient.setQueryData(keys, data)
}

export function removeQueriesData(
  queryClient: QueryClient,
  keys: readonly unknown[],
) {
  return queryClient.removeQueries({ queryKey: keys })
}
