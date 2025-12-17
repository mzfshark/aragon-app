import { adminPlugin } from '@/plugins/adminPlugin/constants/adminPlugin';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { ipfsUtils } from '@/shared/utils/ipfsUtils';
import { transactionUtils, type ITransactionRequest } from '@/shared/utils/transactionUtils';
import { getPublicClient } from '@/shared/utils/networkUtils/publicClient';
import {
    encodeAbiParameters,
    encodeFunctionData,
    parseEventLogs,
    zeroAddress,
    type Hex,
    type TransactionReceipt,
} from 'viem';
import type { ICreateDaoFormData } from '../../components/createDaoForm';
import { adminPluginSetupAbi } from './adminPluginSetupAbi';
import { daoFactoryAbi } from './daoFactoryAbi';
import { daoRegistryAbi } from './daoRegistryAbi';

export interface IBuildTransactionParams {
    /**
     * Values of the create-dao form.
     */
    values: ICreateDaoFormData;
    /**
     * CID of the DAO metadata pinned on IPFS.
     */
    metadataCid: string;
    /**
     * Connected user to be used as admin.
     */
    connectedAddress: string;
}

class PublishDaoDialogUtils {
    prepareMetadata = (formValues: ICreateDaoFormData, avatarCid?: string) => {
        const { name, description, resources } = formValues;
        const processedAvatar = ipfsUtils.cidToUri(avatarCid);

        return {
            name,
            description,
            links: resources,
            avatar: processedAvatar,
        };
    };

    buildTransaction = async (params: IBuildTransactionParams): Promise<ITransactionRequest> => {
        const { values, metadataCid, connectedAddress } = params;
        const { network, ens } = values;

        const { daoFactory } = networkDefinitions[network].addresses;
        const adminPluginRepo = adminPlugin.repositoryAddresses[network];

        // Basic safety checks to avoid sending failing transactions
        const ZERO = '0x0000000000000000000000000000000000000000' as const;
        if (!daoFactory || daoFactory.toLowerCase() === ZERO) {
            throw new Error(
                `DAOFactory address not configured for network ${network}. Please set it in networkDefinitions.addresses.daoFactory.`,
            );
        }
        if (!adminPluginRepo || adminPluginRepo.toLowerCase() === ZERO) {
            throw new Error(
                `Admin plugin repository is not configured for network ${network}. Update adminPlugin.repositoryAddresses to a valid repo address.`,
            );
        }

        const daoSettings = this.buildDaoSettingsParams(metadataCid, ens);
        const pluginSettings = this.buildPluginSettingsParams(adminPluginRepo, connectedAddress);

        // Simulação prévia para capturar motivo de revert antes de enviar
        const client = getPublicClient(network);
        try {
            await client.simulateContract({
                abi: daoFactoryAbi,
                address: daoFactory as Hex,
                functionName: 'createDao',
                args: [daoSettings, pluginSettings],
                account: connectedAddress as Hex,
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(
                `Falha na simulação de criação do DAO em ${network}: ${message}. Verifique se o Admin PluginRepo possui a versão publicada para esta rede e se os endereços em networkDefinitions estão corretos.`,
            );
        }

        const transactionData = encodeFunctionData({
            abi: daoFactoryAbi,
            functionName: 'createDao',
            args: [daoSettings, pluginSettings],
        });

        const transaction = { to: daoFactory, data: transactionData, value: BigInt(0) };

        return transaction;
    };

    getDaoAddress = (receipt: TransactionReceipt) => {
        const [daoCreationLog] = parseEventLogs({
            abi: daoRegistryAbi,
            eventName: 'DAORegistered',
            logs: receipt.logs,
            strict: false,
        });

        const { dao: daoAddress } = daoCreationLog.args;

        return daoAddress;
    };

    private buildDaoSettingsParams = (metadataCid: string, ens?: string) => {
        const metadata = transactionUtils.stringToMetadataHex(metadataCid);

        const createDaoParams = {
            subdomain: ens ?? '',
            metadata,
            daoURI: '',
            trustedForwarder: zeroAddress,
        };

        return createDaoParams;
    };

    private buildPluginSettingsParams = (adminPluginRepo: Hex, connectedAddress: string) => {
        const pluginSettingsData = encodeAbiParameters(adminPluginSetupAbi, [
            connectedAddress as Hex,
            { target: zeroAddress, operation: 0 },
        ]);

        // Normalize versionTag to the minimal ABI shape expected: { release, build }
        const versionTag: { release: number; build: number } = {
            release: adminPlugin.installVersion.release,
            build: adminPlugin.installVersion.build,
        };

        const pluginSettingsParams = {
            pluginSetupRef: {
                pluginSetupRepo: adminPluginRepo as Hex,
                versionTag,
            },
            data: pluginSettingsData,
        } as const;

        return [pluginSettingsParams] as const;
    };
}

export const publishDaoDialogUtils = new PublishDaoDialogUtils();
