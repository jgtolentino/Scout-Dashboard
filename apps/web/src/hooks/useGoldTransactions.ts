import useSWR from 'swr'
import { listRecentTx, countRecentTx, TxFilters, SortKey } from '@/services/gold'

export function useGoldTransactions(p: { page?: number; pageSize?: number; sort?: SortKey; filters?: TxFilters } = {}) {
  const pageSize = p.pageSize ?? 100
  const offset = ((p.page ?? 1) - 1) * pageSize
  const key = ['gold:list', pageSize, offset, p.sort, JSON.stringify(p.filters)]
  const { data, error, isLoading } = useSWR(key, () => listRecentTx({ limit: pageSize, offset, sort: p.sort, filters: p.filters }))
  const { data: total } = useSWR(['gold:count', JSON.stringify(p.filters)], () => countRecentTx(p.filters ?? {}))
  return { rows: data ?? [], total: total ?? 0, isLoading, error }
}