//! Provides error types which can be returned by Marketplace Contract.
//! Read more about errors which can be returned by a Concordium Contract [here](https://developer.concordium.software/en/mainnet/smart-contracts/guides/custom-errors.html)

use cis2_common_utils::errors::Cis2ClientError;
use concordium_std::*;

#[derive(Serialize, Debug, PartialEq, Eq, Reject, SchemaType)]
pub enum MarketplaceError {
    ParseParams,
    CalledByAContract,
    TokenNotListed,
    Cis2ClientError(Cis2ClientError),
    InvalidAmountPaid,
    InvokeTransferError,
    NoBalance,
    InvalidCommission,
    InvalidTokenQuantity,
    InvalidRoyalty,
    TokenNotInCustody,
    CalledByAnAccount,
}

impl From<Cis2ClientError> for MarketplaceError {
    fn from(e: Cis2ClientError) -> Self {
        MarketplaceError::Cis2ClientError(e)
    }
}

impl From<ParseError> for MarketplaceError {
    fn from(_: ParseError) -> Self {
        MarketplaceError::ParseParams
    }
}
