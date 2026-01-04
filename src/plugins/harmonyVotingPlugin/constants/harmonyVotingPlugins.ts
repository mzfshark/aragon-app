import { Network, PluginInterfaceType } from '@/shared/api/daoService';
import type { IPluginInfo } from '@/shared/types';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const harmonyHipVotingPlugin: IPluginInfo = {
    id: PluginInterfaceType.HARMONY_HIP_VOTING,
    subdomain: 'harmonyHipVoting',
    name: 'Harmony HIP Voting',
    installVersion: { release: 1, build: 1, releaseNotes: '', description: '' },
    repositoryAddresses: {
        [Network.ARBITRUM_MAINNET]: ZERO_ADDRESS,
        [Network.BASE_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_SEPOLIA]: ZERO_ADDRESS,
        [Network.POLYGON_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_SEPOLIA]: ZERO_ADDRESS,
        [Network.PEAQ_MAINNET]: ZERO_ADDRESS,
        [Network.OPTIMISM_MAINNET]: ZERO_ADDRESS,
        [Network.CHILIZ_MAINNET]: ZERO_ADDRESS,
        [Network.AVAX_MAINNET]: ZERO_ADDRESS,
        [Network.KATANA_MAINNET]: ZERO_ADDRESS,
        [Network.HARMONY_MAINNET]: '0xB63fC0a5747a96F643B9f43156D8D041df48eC30',
        [Network.HARMONY_TESTNET]: ZERO_ADDRESS,
    },
    setup: {
        nameKey: 'app.plugins.harmonyHipVoting.setup.name',
        descriptionKey: 'app.plugins.harmonyHipVoting.setup.description',
    },
};

export const harmonyDelegationVotingPlugin: IPluginInfo = {
    id: PluginInterfaceType.HARMONY_DELEGATION_VOTING,
    subdomain: 'harmonyDelegationVoting',
    name: 'Harmony Delegation Voting',
    installVersion: { release: 1, build: 1, releaseNotes: '', description: '' },
    repositoryAddresses: {
        [Network.ARBITRUM_MAINNET]: ZERO_ADDRESS,
        [Network.BASE_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_MAINNET]: ZERO_ADDRESS,
        [Network.ETHEREUM_SEPOLIA]: ZERO_ADDRESS,
        [Network.POLYGON_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_MAINNET]: ZERO_ADDRESS,
        [Network.ZKSYNC_SEPOLIA]: ZERO_ADDRESS,
        [Network.PEAQ_MAINNET]: ZERO_ADDRESS,
        [Network.OPTIMISM_MAINNET]: ZERO_ADDRESS,
        [Network.CHILIZ_MAINNET]: ZERO_ADDRESS,
        [Network.AVAX_MAINNET]: ZERO_ADDRESS,
        [Network.KATANA_MAINNET]: ZERO_ADDRESS,
        [Network.HARMONY_MAINNET]: '0xACcA531400E43ABF8d4dD778D4e63465d27b0D47',
        [Network.HARMONY_TESTNET]: ZERO_ADDRESS,
    },
    setup: {
        nameKey: 'app.plugins.harmonyDelegationVoting.setup.name',
        descriptionKey: 'app.plugins.harmonyDelegationVoting.setup.description',
    },
};
