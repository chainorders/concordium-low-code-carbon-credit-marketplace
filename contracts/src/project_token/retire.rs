use concordium_std::*;

use super::{contract_types::*, error::*, state::*, events::*};

#[derive(Serial, Deserial, SchemaType)]
struct RetireParams {
    tokens: Vec<ContractTokenId>,
    owner: Address,
}

#[receive(
    contract = "project_token",
    name = "retire",
    parameter = "RetireParams",
    error = "ContractError",
    enable_logger,
    mutable,
)]
fn retire<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let params: RetireParams = ctx.parameter_cursor().get()?;
    ensure!(ctx.sender() == params.owner, ContractError::Unauthorized);

    let state = host.state_mut();
    for token_id in params.tokens {
        let token = state.get_token(&token_id);
        // Ensure that the token exists.
        ensure!(token.is_some(), ContractError::InvalidTokenId);
        let token = token.unwrap();

        // Ensure that the token is mature.
        ensure!(
            token.is_mature(&ctx.metadata().slot_time()),
            ContractError::Custom(CustomContractError::TokenNotMature)
        );
        // Ensure token is verified
        ensure!(
            state.is_verified(&token_id),
            ContractError::Custom(CustomContractError::TokenNotVerified)
        );
        // Ensure that the sender has token balance.
        ensure!(
            state.balance(&token_id, &params.owner)?.cmp(&0.into()).is_gt(),
            ContractError::Unauthorized
        );

        // Retire token.
        state.burn(&token_id, &params.owner)?;

        //log token retire event.
        logger.log(&ContractEvent::Retire(BurnEvent {
            token_id,
            owner: params.owner,
            amount: 1.into()
        }))?;
    }

    Ok(())
}
