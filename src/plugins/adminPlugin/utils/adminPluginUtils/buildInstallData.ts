import { encodeAbiParameters, type Hex } from 'viem';

export type AdminOperation = 0 | 1; // 0=Call, 1=DelegateCall

/**
 * Builds the Admin plugin installation payload matching AdminPluginSetup ABI:
 * (address admin, (address target, uint8 operation) targetConfig)
 */
export function buildAdminInstallData(params: {
  admin: `0x${string}`;
  target: `0x${string}`;
  operation?: AdminOperation;
}): Hex {
  const { admin, target, operation = 0 } = params;
  return encodeAbiParameters(
    [
      { name: 'admin', type: 'address' },
      {
        name: 'targetConfig',
        type: 'tuple',
        components: [
          { name: 'target', type: 'address' },
          { name: 'operation', type: 'uint8' },
        ],
      },
    ],
    [admin, { target, operation }]
  );
}
