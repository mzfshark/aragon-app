import type { Hex } from 'viem';

export interface ITransactionRequest {
    /**
     * Target of the transaction.
     */
    to: Hex;
    /**
     * Data of the transaction.
     */
    data: Hex;
    /**
     * Value of the transaction, marked as required because it is needed for most of the smart contract functions (e.g. create-proposal)
     */
    value: bigint;

    /**
     * Optional gas limit override.
     * Used for chains/providers where gas estimation is unreliable for large calldata.
     */
    gas?: bigint;
}
