use concordium_std::*;

use crate::client_utils::{client::Client, types::IsVerifiedQueryResponse};

use super::{
    contract_types::{ContractIsVerifiedQueryParams, ContractResult},
    error::*,
    state::State,
};

#[receive(
    contract = "project_fractionalizer",
    name = "isVerified",
    parameter = "ContractIsVerifiedQueryParams",
    error = "ContractError",
    return_value = "IsVerifiedQueryResponse",
    mutable
)]
pub fn is_verified<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<IsVerifiedQueryResponse> {
    // Parse the parameter.
    let ContractIsVerifiedQueryParams { queries } = ctx.parameter_cursor().get()?;
    let state = host.state();

    let mut res = Vec::with_capacity(queries.len());

    for token_id in queries.iter() {
        ensure!(
            state.contains_token(token_id),
            ContractError::InvalidTokenId
        );
        let (collateral_token, _) =
            state
                .find_collateral(token_id)
                .ok_or(ContractError::Custom(
                    CustomContractError::InvalidCollateral,
                ))?;

        let is_verified =
            Client::is_verified(host, collateral_token.token_id, collateral_token.contract)?;
        res.push(is_verified);
    }

    Ok(res)
}
