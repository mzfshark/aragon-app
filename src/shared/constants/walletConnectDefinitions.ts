export const walletConnectDefinitions = {
    // WalletConnect project ID.
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,

    // Metadata used during the wallet connection flow and the dApp connect feature.
    metadata: {
        name: 'Governance Country',
        description: 'Governance Country',
        url: 'https://governance.country',
        icons: ['https://governance.country/icon.png'],
    },
};
