use concordium_cis2::{OnReceivingCis2Params, TokenAmountU64, TokenIdU8};

pub mod cis2_client;
pub mod errors;
/// Type of token Id used by the CIS2 contract.
pub type ContractTokenId = TokenIdU8;
/// Type of Token Amount used by the CIS2 contract.
pub type ContractTokenAmount = TokenAmountU64;
pub type ContractOnReceivingCis2Params =
    OnReceivingCis2Params<ContractTokenId, ContractTokenAmount>;