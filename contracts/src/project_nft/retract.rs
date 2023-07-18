use concordium_std::*;

use super::{contract_types::*, error::*, events::*, state::*};

#[derive(Serial, Deserial, SchemaType)]
struct RetractParams {
    tokens: Vec<ContractTokenId>,
}

#[receive(
    contract = "project_nft",
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
    let sender = ctx.sender();
    let params: RetractParams = ctx.parameter_cursor().get()?;

    let state = host.state_mut();
    for token_id in params.tokens {
        let token = state.get_token(&token_id);
        // Ensure that the token exists.
        ensure!(token.is_some(), ContractError::InvalidTokenId);
        let token = token.unwrap();

        // Ensure that the token is mature.
        ensure!(
            !token.is_mature(&ctx.metadata().slot_time()),
            ContractError::Custom(CustomContractError::TokenNotMature)
        );
        // Ensure that the sender has token balance or is a verifier.
        ensure!(
            state.balance(&token_id, &sender)?.cmp(&0.into()).is_gt() || state.is_verifier(&sender),
            ContractError::Unauthorized
        );

        // Retire token.
        state.burn(&token_id, &sender)?;

        //log token retire event.
        logger.log(&ContractEvent::Retract(BurnEvent {
            token_id,
            owner: sender,
            amount: 1.into(),
        }))?;
    }

    Ok(())
}
