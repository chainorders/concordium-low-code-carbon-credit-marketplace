use concordium_std::*;

use super::{contract_types::*, error::*, events::*, state::*};

#[derive(Serial, Deserial, SchemaType)]
struct RetractParams {
    tokens: Vec<ContractTokenId>,
    owner: Address,
}

#[receive(
    contract = "project_token",
    name = "retract",
    parameter = "RetractParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn retract<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let params: RetractParams = ctx.parameter_cursor().get()?;
    let state = host.state_mut();
    let sender = ctx.sender();
    ensure!(
        sender == params.owner || state.is_verifier(&sender),
        ContractError::Unauthorized
    );

    for token_id in params.tokens {
        let token = state.get_token(&token_id);
        // Ensure that the token exists.
        ensure!(token.is_some(), ContractError::InvalidTokenId);

        // Ensure token is NOT verified
        ensure!(
            !state.is_verified(&token_id),
            ContractError::Custom(CustomContractError::TokenVerified)
        );

        // Ensure that the sender has token balance or is a verifier.
        let balance = state.balance(&token_id, &params.owner)?;
        ensure!(balance.cmp(&0.into()).is_gt(), ContractError::Unauthorized);

        // Retire token.
        state.burn(&token_id, &params.owner)?;

        //log token retire event.
        logger.log(&ContractEvent::Retract(BurnEvent {
            token_id,
            owner: params.owner,
            amount: 1.into(),
        }))?;
    }

    Ok(())
}
