use concordium_cis2::{
    BalanceOfQueryParams, BalanceOfQueryResponse, TokenAmountU64, TokenAmountU8, TransferParams,
};

pub use crate::client_utils::types::ContractTokenId;
use crate::client_utils::types::{MaturityOfQueryParams, IsVerifiedQueryParams};

use super::error::ContractError;

pub type ContractTokenAmount = TokenAmountU64;
pub type ContractCollateralTokenAmount = TokenAmountU8;
pub type ContractResult<A> = Result<A, ContractError>;
/// Parameter type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenIDs used by this contract.
pub type ContractBalanceOfQueryParams = BalanceOfQueryParams<ContractTokenId>;

/// Response type for the CIS-2 function `balanceOf` specialized to the subset
/// of TokenAmounts used by this contract.
pub type ContractBalanceOfQueryResponse = BalanceOfQueryResponse<ContractTokenAmount>;

pub type TransferParameter = TransferParams<ContractTokenId, ContractTokenAmount>;
pub type ContractMaturityOfQueryParams = MaturityOfQueryParams<ContractTokenId>;
pub type ContractIsVerifiedQueryParams = IsVerifiedQueryParams<ContractTokenId>;