import type { IBuildPreparePluginInstallDataParams } from '@/modules/createDao/types';
import { pluginTransactionUtils } from '@/shared/utils/pluginTransactionUtils';
import { encodeAbiParameters, type Hex } from 'viem';
import type { IPluginInfo } from '@/shared/types';
import type { IHarmonyVotingSetupGovernanceForm } from '../components/harmonyVotingSetupGovernance';

const harmonyVotingSetupAbi = [
    { name: 'proposer', type: 'address' },
    { name: 'oracle', type: 'address' },
] as const;

export type IPrepareHarmonyVotingInstallDataParams = IBuildPreparePluginInstallDataParams<IHarmonyVotingSetupGovernanceForm>;

export const buildPrepareHarmonyVotingInstallData = (plugin: IPluginInfo, params: IPrepareHarmonyVotingInstallDataParams): Hex => {
    const { body, metadata, dao } = params;

    const { proposer, oracle } = body.governance;

    const repositoryAddress = plugin.repositoryAddresses[dao.network];

    const pluginSettingsData = encodeAbiParameters(harmonyVotingSetupAbi, [proposer as Hex, oracle as Hex]);

    return pluginTransactionUtils.buildPrepareInstallationData(
        repositoryAddress,
        plugin.installVersion,
        pluginSettingsData,
        dao.address as Hex,
    );
};
