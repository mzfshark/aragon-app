'use client';

import { useTranslations } from '@/shared/components/translationsProvider';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { daoUtils } from '@/shared/utils/daoUtils';
import { dataListUtils } from '@/shared/utils/dataListUtils';
import { ipfsUtils } from '@/shared/utils/ipfsUtils';
import type { Network } from '@/shared/api/daoService';
import {
    Button,
    DaoDataListItem,
    DataListContainer,
    DataListFilter,
    DataListPagination,
    DataListRoot,
    invariant,
    useDebouncedValue,
} from '@aragon/gov-ui-kit';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    useDaoList,
    useDaoListByMemberAddress,
    useArchivedDaoList,
    daoExplorerAdminService,
    DaoExplorerServiceKey,
    type IGetDaoListByMemberAddressParams,
    type IGetDaoListParams,
} from '../../api/daoExplorerService';

export interface IDaoListProps {
    /**
     * Initial parameters to use for fetching the list of DAOs.
     */
    initialParams?: IGetDaoListParams;
    /**
     * Parameters to use for fetching the list of archived (hidden) DAOs. Overrides other params when set.
     */
    archivedParams?: IGetDaoListParams;
    /**
     * Parameters to use for fetching the list of DAOs for a given address. Overrides the initialParams when set.
     */
    memberParams?: IGetDaoListByMemberAddressParams;
    /**
     * Overrides the custom layout classes when set.
     */
    layoutClassNames?: string;
    /**
     * Show DAO search input.
     */
    showSearch?: boolean;

    /**
     * Enables root-only archive/unarchive actions in the list.
     */
    enableRootActions?: boolean;
}

export const DaoList: React.FC<IDaoListProps> = (props) => {
    const { initialParams, archivedParams, memberParams, layoutClassNames, showSearch, enableRootActions } = props;
    const { t } = useTranslations();

    invariant(
        archivedParams != null || initialParams != null || memberParams != null,
        'DaoList: one of archivedParams, initialParams or memberParams must be provided',
    );

    const [searchValue, setSearchValue] = useState<string>();
    const [searchValueDebounced] = useDebouncedValue(searchValue, { delay: 500 });

    const defaultResult = useDaoList(
        { ...initialParams, queryParams: { ...initialParams?.queryParams, search: searchValueDebounced } },
        { enabled: initialParams != null && memberParams == null && archivedParams == null },
    );

    const archivedResult = useArchivedDaoList(
        { ...archivedParams, queryParams: { ...archivedParams?.queryParams, search: searchValueDebounced } },
        { enabled: archivedParams != null },
    );

    const memberResult = useDaoListByMemberAddress(
        { ...memberParams!, queryParams: { ...memberParams?.queryParams, search: searchValueDebounced } },
        { enabled: memberParams != null },
    );

    const { data, fetchNextPage, status, fetchStatus, isFetchingNextPage } =
        archivedParams != null ? archivedResult : memberParams != null ? memberResult : defaultResult;

    const daoList = data?.pages.flatMap((page) => page.data);

    const state = dataListUtils.queryToDataListState({ status, fetchStatus, isFetchingNextPage });

    const pageSize =
        archivedParams?.queryParams.pageSize ??
        initialParams?.queryParams.pageSize ??
        memberParams?.queryParams.pageSize ??
        data?.pages[0]?.metadata?.pageSize;

    const itemsCount = data?.pages[0]?.metadata?.totalRecords;

    const emptyState = {
        heading: t('app.explore.daoList.emptyState.heading'),
        description: t('app.explore.daoList.emptyState.description'),
    };

    const errorState = {
        heading: t('app.explore.daoList.errorState.heading'),
        description: t('app.explore.daoList.errorState.description'),
    };

    const queryClient = useQueryClient();
    const { mutate: setVisibilityStatus, isPending: isSettingVisibility } = useMutation({
        mutationFn: (params: { daoAddress: string; network: Network; status: 'true' | 'false' }) =>
            daoExplorerAdminService.setDaoVisibilityStatus({
                urlParams: { daoAddress: params.daoAddress, network: params.network, status: params.status },
            }),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.ARCHIVED_DAO_LIST] }),
                queryClient.invalidateQueries({ queryKey: [DaoExplorerServiceKey.DAO_LIST_BY_MEMBER_ADDRESS] }),
            ]);
        },
    });

    const showVisibilityAction =
        enableRootActions === true && (archivedParams != null || (memberParams == null && initialParams != null));
    const isArchivedList = archivedParams != null;

    return (
        <DataListRoot
            entityLabel={t('app.explore.daoList.entity')}
            onLoadMore={fetchNextPage}
            state={state}
            pageSize={pageSize}
            itemsCount={itemsCount}
        >
            {showSearch && (
                <DataListFilter
                    onSearchValueChange={setSearchValue}
                    searchValue={searchValue}
                    placeholder={t('app.explore.daoList.searchPlaceholder')}
                />
            )}
            <DataListContainer
                errorState={errorState}
                emptyState={emptyState}
                SkeletonElement={DaoDataListItem.Skeleton}
                layoutClassName={layoutClassNames ?? 'grid grid-cols-1 lg:grid-cols-2'}
            >
                {daoList?.map((dao) => (
                    <div key={dao.id} className="relative">
                        <DaoDataListItem.Structure
                            href={daoUtils.getDaoUrl(dao, 'dashboard')}
                            ens={daoUtils.getDaoEns(dao)}
                            address={dao.address}
                            name={dao.name}
                            description={dao.description}
                            network={networkDefinitions[dao.network].name}
                            logoSrc={ipfsUtils.cidToSrc(dao.avatar)}
                        />
                        {showVisibilityAction && (
                            <div className="absolute right-3 top-3 z-10">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={isSettingVisibility}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();

                                        setVisibilityStatus({
                                            daoAddress: dao.address,
                                            network: dao.network,
                                            status: isArchivedList ? 'true' : 'false',
                                        });
                                    }}
                                >
                                    {isArchivedList
                                        ? t('app.explore.daoList.actions.restore')
                                        : t('app.explore.daoList.actions.archive')}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </DataListContainer>
            <DataListPagination />
        </DataListRoot>
    );
};
