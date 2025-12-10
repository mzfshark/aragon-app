import { HttpService } from '../httpService';

class IpfsService extends HttpService {
    get jwt() {
        const jwt = process.env.NEXT_SECRET_IPFS_JWT;
        if (!jwt) {
            throw new Error(
                'IPFS JWT não configurado. Defina NEXT_SECRET_IPFS_JWT no .env.local (Pinata JWT).',
            );
        }
        return jwt;
    }

    urls = {
        pinJson: '/pinning/pinJSONToIPFS',
        pinFile: '/pinning/pinFileToIPFS',
    };

    constructor() {
        super('https://api.pinata.cloud');
    }
}

export const ipfsService = new IpfsService();
