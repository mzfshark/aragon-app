import type { ISetupBodyFormMembership } from '@/modules/createDao/dialogs/setupBodyDialog';
import type { IPluginSetupMembershipParams } from '@/modules/createDao/types';

export interface IHarmonyVotingSetupMembershipForm extends ISetupBodyFormMembership {}

export interface IHarmonyVotingSetupMembershipProps extends IPluginSetupMembershipParams {
    daoId?: string;
}
