use concordium_cis2::*;

/// Type of token Id used by the CIS2 contract.
pub type ContractTokenId = TokenIdU8;
/// Type of Token Amount used by the CIS2 contract.
pub type ContractTokenAmount = TokenAmountU64;
pub type ContractOnReceivingCis2Params =
    OnReceivingCis2Params<ContractTokenId, ContractTokenAmount>;