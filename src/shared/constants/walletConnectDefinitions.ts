const isLocal = process.env.NEXT_PUBLIC_ENV === 'local';
const metadataUrl = isLocal ? 'http://localhost:3000' : 'https://governance.country';
const metadataIcons = isLocal ? ['http://localhost:3000/icon.png'] : ['https://governance.country/icon.png'];

export const walletConnectDefinitions = {
    // WalletConnect project ID.
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,

    // Metadata used during the wallet connection flow and the dApp connect feature.
    metadata: {
        name: 'Governance Country',
        description: 'Governance Country',
        url: metadataUrl,
        icons: metadataIcons,
    },
};
