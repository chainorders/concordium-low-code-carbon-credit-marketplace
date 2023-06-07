import { SmartContractParameters, WalletApi } from '@concordium/browser-wallet-api-helpers';
import { ContractAddress, TransactionSummary } from '@concordium/web-sdk';

import { ContractInfo, updateContract } from './ConcordiumContractClient';

export interface MintParams {
  owner: { Account: [string] };
  tokens: [
    [
      string,
      {
        metadata: {
          url: string;
          hash?: string;
        };
        amount: string;
        contract: { index: number; subindex: number };
        token_id: string;
      },
    ],
  ];
}

/**
 * Adds a token to buyable list of tokens in marketplace.
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param fracContractAddress Market place contract Address.
 * @param paramJson Marketplace Add Method Params.
 * @param maxContractExecutionEnergy Max energy allowed for the transaction.
 * @returns Transaction outcomes.
 */
export async function mint(
  provider: WalletApi,
  account: string,
  fracContractAddress: ContractAddress,
  paramJson: MintParams,
  contractInfo: ContractInfo,
  maxContractExecutionEnergy = BigInt(9999),
): Promise<Record<string, TransactionSummary>> {
  return updateContract(
    provider,
    contractInfo,
    paramJson as unknown as SmartContractParameters,
    account,
    fracContractAddress,
    "mint",
    maxContractExecutionEnergy,
  );
}
