import type { IBuildPreparePluginInstallDataParams } from '@/modules/createDao/types';
import { pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';
import type { Hex } from 'viem';
import type { IPluginInfo } from '@/shared/types';
import type { IHarmonyVotingSetupGovernanceForm } from '../components/harmonyVotingSetupGovernance';

export type IPrepareHarmonyVotingInstallDataParams = IBuildPreparePluginInstallDataParams<IHarmonyVotingSetupGovernanceForm>;

export const buildPrepareHarmonyVotingInstallData = (plugin: IPluginInfo, params: IPrepareHarmonyVotingInstallDataParams): Hex => {
    const { dao } = params;

    const repositoryAddress = plugin.repositoryAddresses[dao.network];

    // Oracle is fixed per network (backend automation). Installation params are intentionally empty.
    const pluginSettingsData = '0x' as Hex;

    return pluginTransactionUtils.buildPrepareInstallationData(
        repositoryAddress,
        plugin.installVersion,
        pluginSettingsData,
        dao.address as Hex,
    );
};
