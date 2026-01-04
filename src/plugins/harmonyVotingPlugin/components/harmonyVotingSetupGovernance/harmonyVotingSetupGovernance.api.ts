import type { IPluginSetupGovernanceParams } from '@/modules/createDao/types';

export interface IHarmonyVotingSetupGovernanceForm {
    proposer: string;
    oracle: string;
}

export interface IHarmonyVotingSetupGovernanceProps extends IPluginSetupGovernanceParams {
    daoId?: string;
}
