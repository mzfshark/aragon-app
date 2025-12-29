import { type IPaginatedResponse } from '@/shared/api/aragonBackendService';
import { type IDao } from '@/shared/api/daoService';
import type { InfiniteQueryOptions, SharedInfiniteQueryOptions } from '@/shared/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { daoExplorerAdminService } from '../../daoExplorerService';
import { type IGetDaoListParams } from '../../daoExplorerService.api';
import { daoExplorerServiceKeys } from '../../daoExplorerServiceKeys';

export const archivedDaoListOptions = (
    params: IGetDaoListParams,
    options?: InfiniteQueryOptions<IPaginatedResponse<IDao>, IGetDaoListParams>,
): SharedInfiniteQueryOptions<IPaginatedResponse<IDao>, IGetDaoListParams> => ({
    queryKey: daoExplorerServiceKeys.archivedDaoList(params),
    initialPageParam: params,
    queryFn: ({ pageParam }) => daoExplorerAdminService.getArchivedDaoList(pageParam),
    getNextPageParam: daoExplorerAdminService.getNextPageParams,
    ...options,
});

export const useArchivedDaoList = (
    params: IGetDaoListParams,
    options?: InfiniteQueryOptions<IPaginatedResponse<IDao>, IGetDaoListParams>,
) => {
    return useInfiniteQuery(archivedDaoListOptions(params, options));
};
