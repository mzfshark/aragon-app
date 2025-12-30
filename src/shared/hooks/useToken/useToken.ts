import { useMemo } from 'react';
import { erc20Abi, zeroAddress } from 'viem';
import { useReadContracts } from 'wagmi';
import { networkDefinitions } from '@/shared/constants/networkDefinitions';
import type { IUseTokenParams, IUseTokenResult } from './useToken.api';

export const useToken = (params: IUseTokenParams): IUseTokenResult => {
    const { address, chainId, enabled = true } = params;

    const isNative = address === zeroAddress;

    const nativeToken = useMemo(() => {
        if (!isNative) {
            return null;
        }

        const definition = Object.values(networkDefinitions).find((d) => d.id === chainId);
        const nativeCurrency = definition?.nativeCurrency;

        if (!nativeCurrency) {
            return { name: '', symbol: '', decimals: 18, totalSupply: null };
        }

        return {
            name: nativeCurrency.name,
            symbol: nativeCurrency.symbol,
            decimals: nativeCurrency.decimals,
            totalSupply: null,
        };
    }, [chainId, isNative]);

    const { data, isLoading, isError } = useReadContracts({
        allowFailure: false,
        query: { enabled: enabled && !isNative },
        contracts: [
            { chainId, address, abi: erc20Abi, functionName: 'name' },
            { chainId, address, abi: erc20Abi, functionName: 'symbol' },
            { chainId, address, abi: erc20Abi, functionName: 'decimals' },
            { chainId, address, abi: erc20Abi, functionName: 'totalSupply' },
        ],
    });

    const token = useMemo(() => {
        if (isNative) {
            return nativeToken;
        }

        if (isLoading || data == null) {
            return null;
        }

        const [name, symbol, decimals, totalSupply] = data;

        return { name, symbol, decimals, totalSupply: totalSupply.toString() };
    }, [data, isLoading]);

    return { data: token, isError: isNative ? false : isError, isLoading: isNative ? false : isLoading };
};
