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
    const { onSuccess, ...restOptions } = options ?? {};

    return useMutation<boolean, unknown, ISetDaoVisibilityStatusParams>({
        mutationFn: (params) => daoExplorerAdminService.setDaoVisibilityStatus(params),
        ...restOptions,
        onSuccess: async (
            ...args: Parameters<NonNullable<SetDaoVisibilityStatusMutationOptions['onSuccess']>>
        ) => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.ARCHIVED_DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST_BY_MEMBER_ADDRESS] }),
            ]);

            await onSuccess?.(...args);
        },
    });
};
