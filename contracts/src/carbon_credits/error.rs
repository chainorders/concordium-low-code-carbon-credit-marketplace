use concordium_cis2::Cis2Error;
use concordium_std::*;

use crate::client_utils::errors::Cis2ClientError;

pub type ContractError = Cis2Error<CustomContractError>;

/// The different errors the contract can produce.
#[derive(Serialize, Debug, PartialEq, Eq, Reject, SchemaType)]
pub enum CustomContractError {
    /// Failed parsing the parameter.
    #[from(ParseError)]
    ParseParams, //-1
    /// Failed logging: Log is full.
    LogFull, //-2
    /// Failed logging: Log is malformed.
    LogMalformed, //-3
    /// Invalid contract name.
    InvalidContractName, //-4
    /// Only a smart contract can call this function.
    ContractOnly, //-5
    /// Failed to invoke a contract.
    InvokeContractError, //-6
    InvalidCollateral,                //-7
    AccountsOnly,                     //-8
    Cis2ClientError(Cis2ClientError), //-9
    NotImplemented,                   //-10
    InvalidVerifierContract,          //-11
    TokenNotMature,                   //-12
    TokenNotVerified,                 //-13
    TokenVerifiedOrMature
}

/// Mapping the logging errors to ContractError.
impl From<LogError> for CustomContractError {
    fn from(le: LogError) -> Self {
        match le {
            LogError::Full => Self::LogFull,
            LogError::Malformed => Self::LogMalformed,
        }
    }
}

/// Mapping errors related to contract invocations to CustomContractError.
impl<T> From<CallContractError<T>> for CustomContractError {
    fn from(_cce: CallContractError<T>) -> Self {
        Self::InvokeContractError
    }
}

/// Mapping CustomContractError to ContractError
impl From<CustomContractError> for ContractError {
    fn from(c: CustomContractError) -> Self {
        Cis2Error::Custom(c)
    }
}

impl From<NewReceiveNameError> for CustomContractError {
    fn from(_: NewReceiveNameError) -> Self {
        Self::InvalidContractName
    }
}

impl From<NewContractNameError> for CustomContractError {
    fn from(_: NewContractNameError) -> Self {
        Self::InvalidContractName
    }
}

impl From<Cis2ClientError> for ContractError {
    fn from(cce: Cis2ClientError) -> Self {
        Cis2Error::Custom(CustomContractError::Cis2ClientError(cce))
    }
}
