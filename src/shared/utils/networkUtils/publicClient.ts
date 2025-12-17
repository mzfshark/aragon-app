import type { Network } from '@/shared/api/daoService';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import { createPublicClient, http } from 'viem';

export const getPublicClient = (network: Network) => {
    const chain = networkDefinitions[network];
    const rpcUrl = chain.rpcUrls?.default?.http?.[0];

    if (!rpcUrl) {
        throw new Error(`RPC URL não configurada para a rede ${chain.name}.`);
    }

    return createPublicClient({ chain, transport: http(rpcUrl) });
};
