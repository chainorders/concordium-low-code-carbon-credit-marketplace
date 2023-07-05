import { SmartContractParameters, WalletApi } from '@concordium/browser-wallet-api-helpers';
import {
    CIS2, ContractAddress, TransactionStatusEnum, TransactionSummary
} from '@concordium/web-sdk';

import * as connClient from './ConcordiumContractClient';
import { projectNftGetTxnContractEvents } from './web/WebClient';

interface MintParams {
  owner: { Account: [string] };
  tokens: MintParam[];
}

interface MintParam {
  metadata_url: {
    url: string;
    hash: { None: never[] } | { Some: [number[]] };
  };
  maturity_time: string;
}

/**
 * Structure of a JSON-formatted metadata.
 */
export interface Metadata {
  name?: string;
  description?: string;
  display?: {
    url: string;
  };
  artifact?: {
    url: string;
  };
  unique?: boolean;
  attributes?: Attribute[];
}

export interface Attribute {
  name: string;
  type: string;
  value: string;
  required?: boolean;
  force?: boolean;
}

export interface TokenInfo {
  metadataUrl: CIS2.MetadataUrl;
  maturityTime: Date;
}

/**
 * Mints multiple NFT in Contract: {@link nftContractAddress}
 * represented by {@link tokens}
 * @param provider Wallet Provider.
 * @param account Account address.
 * @param tokens Map of Token Id and Metadata Url.
 * @param nftContractAddress CIS-NFT contract address.
 * @param maxContractExecutionEnergy Max allowed energy ot Minting.
 * @returns Transaction outcomes {@link Record<string, TransactionSummary>}
 */
export async function mint(
  provider: WalletApi,
  account: string,
  tokens: TokenInfo[],
  nftContractAddress: ContractAddress,
  contractInfo: connClient.ContractInfo,
  maxContractExecutionEnergy = BigInt(9999),
  onStatusUpdate: (status: TransactionStatusEnum, hash: string) => void = (status, hash) => console.log(status, hash),
) {
  const paramJson = {
    owner: {
      Account: [account],
    },
    tokens: tokens.map(
      (token) =>
        ({
          metadata_url: {
            url: token.metadataUrl.url,
            hash: token.metadataUrl.hash ? { Some: [hexToUnsignedInt(token.metadataUrl.hash)] } : { None: [] },
          },
          maturity_time: token.maturityTime.toISOString(),
        } as MintParam),
    ),
  } as MintParams;

  const { txnHash } = await connClient.updateContract(
    provider,
    contractInfo,
    paramJson as unknown as SmartContractParameters,
    account,
    nftContractAddress,
    "mint",
    maxContractExecutionEnergy,
    BigInt(0),
    onStatusUpdate,
  );

  const events = await projectNftGetTxnContractEvents(txnHash);
  return (
    events
      //@ts-ignore
      .map((e) => e["Mint"])
      .filter((v) => !!v)
      .map((e) => e[0])
  );
}

export async function retire(
  provider: WalletApi,
  account: string,
  nftContractAddress: ContractAddress,
  contractInfo: connClient.ContractInfo,
  tokenIds: string[],
  maxContractExecutionEnergy = BigInt(9999),
  onStatusUpdate: (status: TransactionStatusEnum, hash: string) => void = (status, hash) => console.log(status, hash),
) {
  const paramsJson = {
    tokens: tokenIds,
  };

  const outcomes = await connClient.updateContract(
    provider,
    contractInfo,
    paramsJson as unknown as SmartContractParameters,
    account,
    nftContractAddress,
    "retire",
    maxContractExecutionEnergy,
    BigInt(0),
    onStatusUpdate,
  );

  return outcomes;
}

export const toTokenId = (integer: number, contractInfo: connClient.Cis2ContractInfo) => {
  return integer.toString(16).padStart(contractInfo.tokenIdByteSize * 2, "0");
};

const hexToUnsignedInt = (inputStr: string) => {
  const hex = inputStr.toString();
  const Uint8Array = new Array<number>();
  for (let n = 0; n < hex.length; n += 2) {
    Uint8Array.push(parseInt(hex.substr(n, 2), 16));
  }

  return Uint8Array;
};
