import { GovernanceSlotId } from '@/modules/governance/constants/moduleSlots';
import { CreateDaoSlotId } from '@/modules/createDao/constants/moduleSlots';
import { SettingsSlotId } from '@/modules/settings/constants/moduleSlots';
import { useAdminPermissionCheckProposalCreation } from '@/plugins/adminPlugin/hooks/useAdminPermissionCheckProposalCreation';
import { pluginRegistryUtils } from '@/shared/utils/pluginRegistryUtils';
import { AdminMemberInfo } from './components/adminMemberInfo';
import { AdminSettingsPanel } from './components/adminSettingsPanel';
import { AdminVotingTerminal } from './components/adminVotingTerminal';
import { adminPlugin } from './constants/adminPlugin';
import { useAdminGovernanceSettings } from './hooks/useAdminGovernanceSettings';
import { adminPluginUtils } from './utils/adminPluginUtils';
import { adminProposalUtils } from './utils/adminProposalUtils';
import { adminTransactionUtils } from './utils/adminTransactionUtils';
import { buildAdminPrepareInstallTransaction } from './utils/adminPluginUtils/buildPrepareInstallTransaction';

export const initialiseAdminPlugin = () => {
    pluginRegistryUtils
        // Plugin definitions
        .registerPlugin(adminPlugin)

        // Governance module slots
        .registerSlotComponent({
            slotId: GovernanceSlotId.GOVERNANCE_PROPOSAL_VOTING_TERMINAL,
            pluginId: adminPlugin.id,
            component: AdminVotingTerminal,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PROCESS_PROPOSAL_STATUS,
            pluginId: adminPlugin.id,
            function: adminProposalUtils.getProposalStatus,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_BUILD_CREATE_PROPOSAL_DATA,
            pluginId: adminPlugin.id,
            function: adminTransactionUtils.buildCreateProposalData,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_PERMISSION_CHECK_PROPOSAL_CREATION,
            pluginId: adminPlugin.id,
            function: useAdminPermissionCheckProposalCreation,
        })
        .registerSlotFunction({
            slotId: GovernanceSlotId.GOVERNANCE_EXECUTE_CHECK_VERSION_SUPPORTED,
            pluginId: adminPlugin.id,
            function: adminPluginUtils.hasExecuteProposalPermissionModifier,
        })

        // Create DAO slots
        .registerSlotFunction({
            slotId: CreateDaoSlotId.CREATE_DAO_BUILD_PREPARE_PLUGIN_INSTALL_DATA,
            pluginId: adminPlugin.id,
            function: buildAdminPrepareInstallTransaction,
        })

        // Settings module slots
        .registerSlotFunction({
            slotId: SettingsSlotId.SETTINGS_GOVERNANCE_SETTINGS_HOOK,
            pluginId: adminPlugin.id,
            function: useAdminGovernanceSettings,
        })
        .registerSlotComponent({
            slotId: SettingsSlotId.SETTINGS_MEMBERS_INFO,
            pluginId: adminPlugin.id,
            component: AdminMemberInfo,
        })
        .registerSlotComponent({
            slotId: SettingsSlotId.SETTINGS_PANEL,
            pluginId: adminPlugin.id,
            component: AdminSettingsPanel,
        });
};
