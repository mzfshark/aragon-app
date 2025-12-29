import { useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';

import { daoExplorerAdminService } from '../../daoExplorerService';
import { DaoExplorerServiceKey } from '../../daoExplorerServiceKeys';
import type { ISetDaoVisibilityStatusParams } from '../../daoExplorerService.api';

export type SetDaoVisibilityStatusMutationOptions = Omit<
    UseMutationOptions<boolean, unknown, ISetDaoVisibilityStatusParams, unknown>,
    'mutationFn'
>;

export const useSetDaoVisibilityStatus = (options?: SetDaoVisibilityStatusMutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation<boolean, unknown, ISetDaoVisibilityStatusParams>({
        mutationFn: (params) => daoExplorerAdminService.setDaoVisibilityStatus(params),
        ...options,
        onSuccess: async (data, variables, context) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.ARCHIVED_DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST_BY_MEMBER_ADDRESS] }),
            ]);

            await options?.onSuccess?.(data, variables, context);
        },
    });
};
