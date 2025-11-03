import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { fetchIntersections, type IntersectionsFilters } from './client';
import type { IntersectionsListResponse } from './types';

export const intersectionsQueryKey = (filters: IntersectionsFilters = {}) => {
  const normalizedIds = filters.ids && filters.ids.length > 0 ? [...filters.ids].sort().join(',') : null;
  return ['intersections', filters.status ?? null, normalizedIds] as const;
};

export type UseIntersectionsOptions = Omit<
  UseQueryOptions<IntersectionsListResponse, Error, IntersectionsListResponse, ReturnType<typeof intersectionsQueryKey>>,
  'queryKey' | 'queryFn'
>;

export function useIntersections(filters: IntersectionsFilters = {}, options?: UseIntersectionsOptions) {
  const queryKey = intersectionsQueryKey(filters);

  return useQuery({
    queryKey,
    queryFn: () => fetchIntersections(filters),
    staleTime: 30_000,
    ...options,
  });
}
