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
        // Nota: Se o Admin repo não estiver configurado/implantado, prosseguimos sem instalar plugin

        const daoSettings = this.buildDaoSettingsParams(metadataCid, ens);
        const client = getPublicClient(network);

        // Resolve plugin settings: tenta instalar Admin; se repo inválido/sem versão, envia vazio
        let pluginSettings: readonly {
            pluginSetupRef: { pluginSetupRepo: Hex; versionTag: { release: number; build: number } };
            data: Hex;
        }[] = [] as const;

        if (adminPluginRepo && adminPluginRepo.toLowerCase() !== ZERO) {
            const repoCode = await client.getCode({ address: adminPluginRepo as Hex });
            const hasRepo = !!repoCode && repoCode !== '0x';
            if (hasRepo) {
                try {
                    pluginSettings = await this.findValidAdminPluginSettings(
                        network,
                        adminPluginRepo as Hex,
                        connectedAddress,
                        daoFactory as Hex,
                        daoSettings,
                    );
                } catch (err) {
                    // fallback: prossegue sem instalar plugin
                    console.warn('Admin plugin install skipped:', err);
                    pluginSettings = [] as const;
                }
            }
        }

        // Simulação prévia para capturar motivo de revert antes de enviar
        // Simula a criação de DAO (com ou sem plugin). No Harmony, se falhar, tenta sem plugin; se ainda falhar, 
        // faz bypass da simulação e envia direto (RPC costuma ser volátil e não lidar bem com simulações).
        try {
            await client.simulateContract({
                abi: daoFactoryAbi,
                address: daoFactory as Hex,
                functionName: 'createDao',
                args: [daoSettings, pluginSettings],
                account: connectedAddress as Hex,
            });
        } catch (err) {
            const isHarmony = network === 'harmony-mainnet';
            if (isHarmony) {
                try {
                    await client.simulateContract({
                        abi: daoFactoryAbi,
                        address: daoFactory as Hex,
                        functionName: 'createDao',
                        args: [daoSettings, []],
                        account: connectedAddress as Hex,
                    });
                    // Se a simulação sem plugin passou, força a criação sem plugin
                    pluginSettings = [] as const;
                } catch (err2) {
                    console.warn('Harmony simulate bypass: enviando sem simulação devido ao RPC/revert:', err2);
                    // Bypass: mantém pluginSettings calculado (possivelmente vazio) e segue sem simular
                }
            } else {
                throw err;
            }
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

    private buildPluginSettingsParams = (
        adminPluginRepo: Hex,
        connectedAddress: string,
        versionTag: { release: number; build: number },
        target: Hex,
    ) => {
        const pluginSettingsData = encodeAbiParameters(adminPluginSetupAbi, [
            connectedAddress as Hex,
            { target, operation: 0 },
        ]);

        const pluginSettingsParams = {
            pluginSetupRef: {
                pluginSetupRepo: adminPluginRepo as Hex,
                versionTag,
            },
            data: pluginSettingsData,
        } as const;

        return [pluginSettingsParams] as const;
    };

    private getAdminVersionCandidates = (network: ICreateDaoFormData['network']) => {
        const isHarmony = network === 'harmony-mainnet';
        return isHarmony
            ? [
                  { release: 1, build: 1 },
                  { release: 1, build: 2 },
                  { release: 1, build: 0 },
              ]
            : [
                  { release: adminPlugin.installVersion.release, build: adminPlugin.installVersion.build },
                  { release: 1, build: 2 },
                  { release: 1, build: 1 },
                  { release: 1, build: 0 },
              ];
    };

    private async ensureRepoExists(
        network: ICreateDaoFormData['network'],
        adminPluginRepo: Hex,
    ): Promise<void> {
        const client = getPublicClient(network);
        const repoCode = await client.getCode({ address: adminPluginRepo });
        if (!repoCode || repoCode === '0x') {
            throw new Error(
                `O endereço do Admin PluginRepo (${adminPluginRepo}) não possui código na rede ${network}. Verifique se foi implantado via PluginRepoFactory e atualize o mapeamento/endereço.`,
            );
        }
    }

    private findValidAdminPluginSettings = async (
        network: ICreateDaoFormData['network'],
        adminPluginRepo: Hex,
        connectedAddress: string,
        daoFactory: Hex,
        daoSettings: ReturnType<PublishDaoDialogUtils['buildDaoSettingsParams']>,
    ) => {
        const candidates = this.getAdminVersionCandidates(network);
        const errors: string[] = [];

        await this.ensureRepoExists(network, adminPluginRepo);

        // Define um target válido (não-zero) para a configuração do plugin
        const { globalExecutor } = networkDefinitions[network].addresses;
        const target = (globalExecutor || daoFactory) as Hex;

        for (const tag of candidates) {
            const pluginSettings = this.buildPluginSettingsParams(adminPluginRepo, connectedAddress, tag, target);
            try {
                await getPublicClient(network).simulateContract({
                    abi: daoFactoryAbi,
                    address: daoFactory,
                    functionName: 'createDao',
                    args: [daoSettings, pluginSettings],
                    account: connectedAddress as Hex,
                });
                return pluginSettings;
            } catch (err: unknown) {
                errors.push(err instanceof Error ? err.message : String(err));
            }
        }

        throw new Error(
            `Não foi possível preparar a transação de criação do DAO. Tentativas de versão: ${candidates
                .map((c) => `${c.release}.${c.build}`)
                .join(', ')}. Erros: ${errors.join(' | ')}`,
        );
    };
}

export const publishDaoDialogUtils = new PublishDaoDialogUtils();
