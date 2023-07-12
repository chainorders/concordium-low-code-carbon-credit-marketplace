use crate::project_nft::error::*;
use concordium_cis2::*;

pub type ContractTokenId = TokenIdU8;
pub type ContractTokenAmount = TokenAmountU8;
pub type ContractResult<A> = Result<A, ContractError>;
