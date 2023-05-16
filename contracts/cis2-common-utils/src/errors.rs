use concordium_std::*;

#[derive(Serialize, Debug, PartialEq, Eq, Reject)]
pub enum Cis2ClientError {
    InvokeContractError,
    ParseParams,
    ParseResult,
}

impl<T> From<CallContractError<T>> for Cis2ClientError {
    fn from(_: CallContractError<T>) -> Self {
        Cis2ClientError::InvokeContractError
    }
}

impl From<ParseError> for Cis2ClientError {
    fn from(_: ParseError) -> Self {
        Cis2ClientError::ParseParams
    }
}
