import { CIS2 } from '@concordium/web-sdk';

export type Option<T> =
  | {
      Some: [T];
    }
  | { None: [] };
export type Address = {
  Account?: [string];
  Contract?: [{ index: number; subindex: number }];
};

export type ProjectNftMintEvent = {
  owner: Address;
  token_id: string;
  metadata_url: {
    url: string;
    hash: Option<number[]>;
  };
};
export type ProjectNftRetireEvent = {
  owner: Address;
  token_id: string;
};
export type ProjectNftTransferEvent = FractionalizerTransferEvent;

export type ProjectNftEvent = {
  Mint?: [ProjectNftMintEvent];
  Retire?: [ProjectNftRetireEvent];
  Transfer?: [ProjectNftTransferEvent];
};

export type FractionalizerMintEvent = {
  owner: Address;
  token_id: string;
  amount: string;
  metadata_url: {
    url: string;
    hash: Option<number[]>;
  };
};

export type FractionalizerRetireEvent = {
  owner: Address;
  token_id: string;
  amount: string;
};

export type FractionalizerCollateralAddedEvent = {
  owner: Address;
  token_id: string;
  amount: string;
  contract: {
    index: number;
    subindex: number;
  };
};

export type FractionalizerCollateralRemovedEvent = {
  owner: Address;
  token_id: string;
  amount: string;
  contract: {
    index: number;
    subindex: number;
  };
};

export type FractionalizerTransferEvent = {
  token_id: string;
  amount: string;
  from: Address;
  to: Address;
};

export type FractionalizerEvent = {
  Mint?: [FractionalizerMintEvent];
  Retire?: [FractionalizerRetireEvent];
  Transfer?: [FractionalizerTransferEvent];
  CollateralAdded?: [FractionalizerCollateralAddedEvent];
  CollateralRemoved?: [FractionalizerCollateralRemovedEvent];
};

export type MarketTokenListedEvent = {
  token_id: string;
  token_contract: {
    index: number;
    subindex: number;
  };
  price: string;
  amount: string;
};

export type MarketTokenReceivedEvent = {
  token_id: string;
  token_contract: {
    index: number;
    subindex: number;
  };
  amount: string;
  owner: Address;
}
export type MarketTokenTransferredEvent = {
  token_id: string;
  token_contract: {
    index: number;
    subindex: number;
  };
  amount: string;
  from: Address;
  to: Address;
}
export type MarketEvent = {
  TokenListed?: [MarketTokenListedEvent];
  TokenReceived?: [MarketTokenReceivedEvent];
  TokenTransferred?: [MarketTokenTransferredEvent];
};
export type ModuleEvent = ProjectNftEvent | FractionalizerEvent | MarketEvent;
