export interface ICidToSrcOptions {
    /**
     * Size of the image to be loaded, used to optimise the loading of the image.
     * @default 80
     */
    size?: number;
}

class IpfsUtils {
    private ipfsPrefix = 'ipfs://';

    private getIpfsGateway = (): string => {
        const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY;
        return gateway?.trim() ? gateway.trim().replace(/\/$/, '') : 'https://aragon-1.mypinata.cloud';
    };

    private normalizeIpfsPath = (value?: string | null): string | undefined => {
        if (!value) return undefined;

        const trimmed = value.trim();
        if (!trimmed) return undefined;

        // Accept `ipfs://<cid>` and `ipfs://ipfs/<cid>` (and variants with extra path).
        if (trimmed.startsWith(this.ipfsPrefix)) {
            const withoutScheme = trimmed.slice(this.ipfsPrefix.length);
            return this.normalizeIpfsPath(withoutScheme);
        }

        // Accept full gateway URLs like `https://.../ipfs/<cid>` and `/ipfs/<cid>`.
        const ipfsMarkerIndex = trimmed.indexOf('/ipfs/');
        if (ipfsMarkerIndex !== -1) {
            return trimmed.slice(ipfsMarkerIndex + '/ipfs/'.length).replace(/^\/+/, '');
        }

        // Accept bare `ipfs/<cid>`.
        if (trimmed.startsWith('ipfs/')) {
            return trimmed.slice('ipfs/'.length).replace(/^\/+/, '');
        }

        return trimmed.replace(/^\/+/, '');
    };

    cidToSrc = (cid?: string | null, options?: ICidToSrcOptions): string | undefined => {
        const { size = 256 } = options ?? {};
        const processedCid = this.normalizeIpfsPath(cid);

        if (!processedCid) return undefined;

        const processedSize = size.toString();
        const params = new URLSearchParams({ 'img-width': processedSize, 'img-height': processedSize });

        return `${this.getIpfsGateway()}/ipfs/${processedCid}?${params.toString()}`;
    };

    isUri = (value: string) => value.startsWith(this.ipfsPrefix);

    cidToUri = (cid?: string | null): string | undefined => {
        const processedCid = this.normalizeIpfsPath(cid);
        return processedCid ? `${this.ipfsPrefix}${processedCid}` : undefined;
    };

    srcToUri = (src: string): string | undefined => {
        try {
            const url = new URL(src);
            const path = this.normalizeIpfsPath(url.pathname);
            return this.cidToUri(path);
        } catch {
            return this.cidToUri(src);
        }
    };
}

export const ipfsUtils = new IpfsUtils();
