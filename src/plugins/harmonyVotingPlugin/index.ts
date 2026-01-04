import { CreateDaoSlotId } from '@/modules/createDao/constants/moduleSlots';
import { pluginRegistryUtils } from '@/shared/utils/pluginRegistryUtils';
import { HarmonyVotingSetupGovernance } from './components/harmonyVotingSetupGovernance';
import { HarmonyVotingSetupMembership } from './components/harmonyVotingSetupMembership';
import { harmonyDelegationVotingPlugin, harmonyHipVotingPlugin } from './constants/harmonyVotingPlugins';
import { buildPrepareHarmonyVotingInstallData } from './utils/harmonyVotingTransactionUtils';

export const initialiseHarmonyVotingPlugin = () => {
    pluginRegistryUtils
        // Plugin definitions
        .registerPlugin(harmonyHipVotingPlugin)
        .registerPlugin(harmonyDelegationVotingPlugin)

        // Create DAO module slots
        .registerSlotFunction({
            slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
            pluginId: harmonyHipVotingPlugin.id,
            function: (params) => buildPrepareHarmonyVotingInstallData(harmonyHipVotingPlugin, params),
        })
        .registerSlotFunction({
            slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
            pluginId: harmonyDelegationVotingPlugin.id,
            function: (params) => buildPrepareHarmonyVotingInstallData(harmonyDelegationVotingPlugin, params),
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
            pluginId: harmonyHipVotingPlugin.id,
            component: HarmonyVotingSetupMembership,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_MEMBERSHIP,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyVotingSetupMembership,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_GOVERNANCE,
            pluginId: harmonyHipVotingPlugin.id,
            component: HarmonyVotingSetupGovernance,
        })
        .registerSlotComponent({
            slotId: CreateDaoSlotId.CREATE_DAO_SETUP_GOVERNANCE,
            pluginId: harmonyDelegationVotingPlugin.id,
            component: HarmonyVotingSetupGovernance,
        });
};
