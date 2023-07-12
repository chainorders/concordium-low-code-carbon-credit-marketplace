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
  amount: string;
};

export type ProjectNftTokenMetadataEvent = {
  token_id: string;
  metadata_url: {
    url: string;
    hash: Option<number[]>;
  };
};

export type ProjectNftMaturityTimeEvent = {
  token_id: string;
  maturity_time: string;
};

export type ProjectNftRetireEvent = {
  owner: Address;
  token_id: string;
};
export type ProjectNftTransferEvent = {
  token_id: string;
  amount: string;
  from: Address;
  to: Address;
};

export type ProjectNftVerifierAddedEvent = {
  verifier: Address;
};

export type ProjectNftVerifierRemovedEvent = {
  verifier: Address;
};

export type ProjectNftVerificationEvent = {
  token_id: string;
  verifier: Address;
};

export type ProjectNftEvent = {
  Mint?: ProjectNftMintEvent;
  Retire?: ProjectNftRetireEvent;
  Transfer?: ProjectNftTransferEvent;
  TokenMetadata?: ProjectNftTokenMetadataEvent;
  MaturityTime?: ProjectNftMaturityTimeEvent;
  VerifierAdded?: ProjectNftVerifierAddedEvent;
  VerifierRemoved?: ProjectNftVerifierRemovedEvent;
  Verification?: ProjectNftVerificationEvent;
};

export type FractionalizerMintEvent = ProjectNftMintEvent;
export type FractionalizerTokenMetadataEvent = ProjectNftTokenMetadataEvent;
export type FractionalizerTransferEvent = ProjectNftTransferEvent;

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


export type FractionalizerEvent = {
  Mint?: FractionalizerMintEvent;
  TokenMetadata?: FractionalizerTokenMetadataEvent;
  Retire?: FractionalizerRetireEvent;
  Transfer?: FractionalizerTransferEvent;
  CollateralAdded?: FractionalizerCollateralAddedEvent;
  CollateralRemoved?: FractionalizerCollateralRemovedEvent;
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
};
export type MarketTokenTransferredEvent = {
  token_id: string;
  token_contract: {
    index: number;
    subindex: number;
  };
  amount: string;
  from: Address;
  to: Address;
};
export type MarketEvent = {
  TokenListed?: [MarketTokenListedEvent];
  TokenReceived?: [MarketTokenReceivedEvent];
  TokenTransferred?: [MarketTokenTransferredEvent];
};
export type ModuleEvent = ProjectNftEvent | FractionalizerEvent | MarketEvent;
