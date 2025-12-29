import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { MutationOptions, SharedMutationOptions } from '@/shared/types';

import { daoExplorerAdminService } from '../../daoExplorerService';
import { DaoExplorerServiceKey } from '../../daoExplorerServiceKeys';
import type { ISetDaoVisibilityStatusParams } from '../../daoExplorerService.api';

export const setDaoVisibilityStatusOptions = (
    options?: MutationOptions<boolean, ISetDaoVisibilityStatusParams>,
): SharedMutationOptions<boolean, ISetDaoVisibilityStatusParams> => ({
    mutationFn: (params) => daoExplorerAdminService.setDaoVisibilityStatus(params),
    ...options,
});

export const useSetDaoVisibilityStatus = (options?: MutationOptions<boolean, ISetDaoVisibilityStatusParams>) => {
    const queryClient = useQueryClient();

    return useMutation(
        setDaoVisibilityStatusOptions({
            ...options,
            onSuccess: async (...args) => {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST] }),
                    queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.ARCHIVED_DAO_LIST] }),
                    queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST_BY_MEMBER_ADDRESS] }),
                ]);

                await options?.onSuccess?.(...args);
            },
        }),
    );
};
