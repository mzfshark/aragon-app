import type { IDao, IDaoPlugin } from '@/shared/api/daoService';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import type { IPluginInfo } from '@/shared/types';
import {
    encodeAbiParameters,
    encodeFunctionData,
    keccak256,
    parseEventLogs,
    zeroHash,
    type Hex,
    type TransactionReceipt,
} from 'viem';
import { permissionTransactionUtils } from '../permissionTransactionUtils';
import { pluginRegistryUtils } from '../pluginRegistryUtils';
import type { ITransactionRequest } from '../transactionUtils';
import { versionComparatorUtils } from '../versionComparatorUtils';
import { pluginSetupProcessorAbi } from './abi/pluginSetupProcessorAbi';
import type {
    IBuildApplyPluginsInstallationActionsParams,
    IBuildApplyPluginsUpdateActionsParams,
    IBuildApplyPluginUninstallationActionParams,
    IPluginInstallationSetupData,
    IPluginSetupVersionTag,
    IPluginUninstallSetupData,
    IPluginUpdateSetupData,
} from './pluginTransactionUtils.api';

class PluginTransactionUtils {
    // Specifies the type of operation to perform
    // See https://github.com/aragon/osx-commons/blob/main/contracts/src/plugin/IPlugin.sol#L18
    private targetOperation = {
        call: 0,
        delegateCall: 1,
    };

    // Minimal ABI for DAO.execute (IExecutor)
    private daoExecuteAbi = [
        {
            type: 'function',
            name: 'execute',
            stateMutability: 'nonpayable',
            inputs: [
                { name: '_callId', type: 'bytes32' },
                {
                    name: '_actions',
                    type: 'tuple[]',
                    components: [
                        { name: 'to', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'data', type: 'bytes' },
                    ],
                },
                { name: '_allowFailureMap', type: 'uint256' },
            ],
            outputs: [
                { name: 'execResults', type: 'bytes[]' },
                { name: 'failureMap', type: 'uint256' },
            ],
        },
    ] as const;

    private wrapAsDaoExecuteOnHarmony(dao: IDao, tx: ITransactionRequest): ITransactionRequest {
        const daoAddress = dao.address as Hex;

        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;

        // Apenas Harmony: lá o executor é um contrato (globalExecutor) que normalmente não tem ROOT.
        if (dao.network !== 'harmony-mainnet') {
            return tx;
        }

        const txTo = (tx.to as string).toLowerCase();
        const shouldWrap =
            txTo === daoAddress.toLowerCase() ||
            txTo === (pluginSetupProcessor as string).toLowerCase();

        // Envolve apenas chamadas que precisam acontecer com `msg.sender == DAO`.
        if (!shouldWrap) {
            return tx;
        }

        const innerValue = tx.value ?? BigInt(0);

        const wrappedData = encodeFunctionData({
            abi: this.daoExecuteAbi,
            functionName: 'execute',
            args: [
                zeroHash,
                [{ to: tx.to as Hex, value: innerValue, data: tx.data as Hex }],
                BigInt(0),
            ],
        });

        return { to: daoAddress, data: wrappedData, value: BigInt(0) };
    }

    getPluginInstallationSetupData = (receipt: TransactionReceipt): IPluginInstallationSetupData[] => {
        const { logs } = receipt;
        const eventName = 'InstallationPrepared';
        const installationPreparedLogs = parseEventLogs({ abi: pluginSetupProcessorAbi, eventName, logs });

        return installationPreparedLogs.map(({ args }) => ({
            pluginAddress: args.plugin,
            pluginSetupRepo: args.pluginSetupRepo,
            versionTag: args.versionTag,
            preparedSetupData: args.preparedSetupData,
        }));
    };

    getPluginUpdateSetupData = (receipt: TransactionReceipt): IPluginUpdateSetupData[] => {
        const { logs } = receipt;
        const eventName = 'UpdatePrepared';
        const installationPreparedLogs = parseEventLogs({ abi: pluginSetupProcessorAbi, eventName, logs });

        return installationPreparedLogs.map(({ args }) => ({
            pluginSetupRepo: args.pluginSetupRepo,
            versionTag: args.versionTag,
            preparedSetupData: args.preparedSetupData,
            initData: args.initData,
        }));
    };

    getPluginUninstallSetupData = (receipt: TransactionReceipt): IPluginUninstallSetupData => {
        const { logs } = receipt;
        const eventName = 'UninstallationPrepared';
        const uninstallationPreparedLog = parseEventLogs({ abi: pluginSetupProcessorAbi, eventName, logs })[0];
        const { pluginSetupRepo, versionTag, permissions, setupPayload } = uninstallationPreparedLog.args;

        return { pluginAddress: setupPayload.plugin, pluginSetupRepo, versionTag, permissions };
    };

    buildPrepareInstallationData = (pluginAddress: Hex, versionTag: IPluginSetupVersionTag, data: Hex, dao: Hex) => {
        const pluginSetupRef = { pluginSetupRepo: pluginAddress, versionTag };
        const transactionData = encodeFunctionData({
            abi: pluginSetupProcessorAbi,
            functionName: 'prepareInstallation',
            args: [dao, { pluginSetupRef, data }],
        });

        return transactionData;
    };

    buildPrepareUninstallData = (dao: IDao, plugin: IDaoPlugin, helpers: Hex[], data: Hex) => {
        const versionTag = versionComparatorUtils.normaliseComparatorInput(plugin)!;
        const pluginDefinitions = pluginRegistryUtils.getPlugin(plugin.interfaceType)! as IPluginInfo;

        const pluginSetupRef = { pluginSetupRepo: pluginDefinitions.repositoryAddresses[dao.network], versionTag };
        const setupPayload = { plugin: plugin.address as Hex, currentHelpers: helpers, data };

        const transactionData = encodeFunctionData({
            abi: pluginSetupProcessorAbi,
            functionName: 'prepareUninstallation',
            args: [dao.address as Hex, { pluginSetupRef, setupPayload }],
        });

        return transactionData;
    };

    getPluginTargetConfig = (dao: IDao, isAdvancedGovernance?: boolean) => {
        const { globalExecutor } = networkDefinitions[dao.network].addresses;

        const target = isAdvancedGovernance ? globalExecutor : (dao.address as Hex);
        const operation = isAdvancedGovernance ? this.targetOperation.delegateCall : this.targetOperation.call;

        return { target, operation };
    };

    buildApplyPluginsInstallationActions = (
        params: IBuildApplyPluginsInstallationActionsParams,
    ): ITransactionRequest[] => {
        const { dao, setupData, actions = [], executeConditionAddress } = params;
        const daoAddress = dao.address as Hex;

        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;

        // Temporarily grant the ROOT_PERMISSION to the plugin setup processor contract.
        const [grantRootTx, revokeRootTx] = permissionTransactionUtils.buildGrantRevokePermissionTransactions({
            where: daoAddress,
            who: pluginSetupProcessor,
            what: permissionTransactionUtils.permissionIds.rootPermission,
            to: daoAddress,
        });

        const grantRootWrapped = this.wrapAsDaoExecuteOnHarmony(dao, grantRootTx);
        const revokeRootWrapped = this.wrapAsDaoExecuteOnHarmony(dao, revokeRootTx);

        // If executeConditionAddress is provided, we need to revoke the execute permission and grant it with the condition.
        // The first plugin in the setupData is either the SPP or the plugin for basic governance processes.
        const needsExecuteCondition = executeConditionAddress != null;
        const executeWithConditionTransactions = needsExecuteCondition
            ? permissionTransactionUtils.buildExecuteConditionTransactions({
                  dao: daoAddress,
                  plugin: setupData[0].pluginAddress,
                  executeCondition: executeConditionAddress,
              })
            : [];

        const executeWithConditionWrapped = executeWithConditionTransactions.map((tx) =>
            this.wrapAsDaoExecuteOnHarmony(dao, tx),
        );

        const applyInstallationActions = setupData
            .map((data) => this.setupInstallationDataToAction(data, dao))
            .map((tx) => this.wrapAsDaoExecuteOnHarmony(dao, tx));

        const extraActionsWrapped = actions.map((tx) => this.wrapAsDaoExecuteOnHarmony(dao, tx));

        return [
            grantRootWrapped,
            ...applyInstallationActions,
            ...extraActionsWrapped,
            revokeRootWrapped,
            ...executeWithConditionWrapped,
        ];
    };

    buildApplyPluginUninstallationAction = (
        params: IBuildApplyPluginUninstallationActionParams,
    ): ITransactionRequest[] => {
        const { dao, setupData } = params;
        const { pluginSetupRepo, versionTag, permissions, pluginAddress } = setupData;

        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;

        // Temporarily grant the ROOT_PERMISSION to the plugin setup processor contract.
        const [grantRootTx, revokeRootTx] = permissionTransactionUtils.buildGrantRevokePermissionTransactions({
            where: dao.address as Hex,
            who: pluginSetupProcessor,
            what: permissionTransactionUtils.permissionIds.rootPermission,
            to: dao.address as Hex,
        });

        const grantRootWrapped = this.wrapAsDaoExecuteOnHarmony(dao, grantRootTx);
        const revokeRootWrapped = this.wrapAsDaoExecuteOnHarmony(dao, revokeRootTx);

        const pluginSetupRef = { versionTag, pluginSetupRepo };
        const uninstallData = encodeFunctionData({
            abi: pluginSetupProcessorAbi,
            functionName: 'applyUninstallation',
            args: [dao.address as Hex, { plugin: pluginAddress, pluginSetupRef, permissions }],
        });

        const uninstallAction = this.wrapAsDaoExecuteOnHarmony(dao, {
            to: pluginSetupProcessor,
            data: uninstallData,
            value: BigInt(0),
        });

        return [grantRootWrapped, uninstallAction, revokeRootWrapped];
    };

    buildApplyPluginsUpdateActions = (params: IBuildApplyPluginsUpdateActionsParams): ITransactionRequest[] => {
        const { dao, plugins, setupData } = params;
        const daoAddress = dao.address as Hex;

        const requiresRootPermission = setupData.some((data) => data.preparedSetupData.permissions.length > 0);

        const applyUpdateTransactions = plugins
            .map((plugin, index) => this.buildApplyPluginUpdateAction(dao, plugin, setupData[index]))
            .flat();

        if (requiresRootPermission) {
            // Grant ROOT_PERMISSION to the PSP contract if some plugin update requires permissions to be granted or revoked
            const [grantRootTx, revokeRootTx] = permissionTransactionUtils.buildGrantRevokePermissionTransactions({
                where: daoAddress,
                who: networkDefinitions[dao.network].addresses.pluginSetupProcessor,
                what: permissionTransactionUtils.permissionIds.rootPermission,
                to: daoAddress,
            });

            applyUpdateTransactions.unshift(this.wrapAsDaoExecuteOnHarmony(dao, grantRootTx));
            applyUpdateTransactions.push(this.wrapAsDaoExecuteOnHarmony(dao, revokeRootTx));
        }

        return applyUpdateTransactions;
    };

    private buildApplyPluginUpdateAction = (dao: IDao, plugin: IDaoPlugin, setupData: IPluginUpdateSetupData) => {
        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;
        const daoAddress = dao.address as Hex;

        // Temporarily grant the UPGRADE_PLUGIN_PERMISSION to the plugin setup processor contract.
        const [grantUpgradeTx, revokeUpgradeTx] = permissionTransactionUtils.buildGrantRevokePermissionTransactions({
            where: plugin.address as Hex,
            who: pluginSetupProcessor,
            what: permissionTransactionUtils.permissionIds.upgradePluginPermission,
            to: daoAddress,
        });

        const grantUpgradeWrapped = this.wrapAsDaoExecuteOnHarmony(dao, grantUpgradeTx);
        const revokeUpgradeWrapped = this.wrapAsDaoExecuteOnHarmony(dao, revokeUpgradeTx);

        const applyUpdateTransaction = this.wrapAsDaoExecuteOnHarmony(
            dao,
            this.setupUpdateDataToAction(dao, plugin, setupData),
        );

        return [grantUpgradeWrapped, applyUpdateTransaction, revokeUpgradeWrapped];
    };

    private setupUpdateDataToAction = (dao: IDao, plugin: IDaoPlugin, setupData: IPluginUpdateSetupData) => {
        const { pluginSetupRepo, versionTag, initData, preparedSetupData } = setupData;
        const { permissions, helpers } = preparedSetupData;

        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;
        const helpersHash = this.hashHelpers(helpers);
        const pluginSetupRef = { versionTag, pluginSetupRepo };

        const transactionData = encodeFunctionData({
            abi: pluginSetupProcessorAbi,
            functionName: 'applyUpdate',
            args: [
                dao.address as Hex,
                { plugin: plugin.address as Hex, pluginSetupRef, initData, permissions, helpersHash },
            ],
        });

        return { to: pluginSetupProcessor, data: transactionData, value: BigInt(0) };
    };

    private setupInstallationDataToAction = (setupData: IPluginInstallationSetupData, dao: IDao) => {
        const { pluginSetupRepo, versionTag, pluginAddress, preparedSetupData } = setupData;
        const { permissions, helpers } = preparedSetupData;

        const { pluginSetupProcessor } = networkDefinitions[dao.network].addresses;
        const helpersHash = this.hashHelpers(helpers);
        const pluginSetupRef = { versionTag, pluginSetupRepo };

        const transactionData = encodeFunctionData({
            abi: pluginSetupProcessorAbi,
            functionName: 'applyInstallation',
            args: [dao.address as Hex, { pluginSetupRef, plugin: pluginAddress, permissions, helpersHash }],
        });

        return { to: pluginSetupProcessor, data: transactionData, value: BigInt(0) };
    };

    private hashHelpers = (helpers: readonly Hex[]): Hex =>
        keccak256(encodeAbiParameters([{ type: 'address[]' }], [helpers]));
}

export const pluginTransactionUtils = new PluginTransactionUtils();
