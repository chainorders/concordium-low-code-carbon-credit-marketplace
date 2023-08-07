use concordium_std::*;

use crate::client_utils::{client::Client, types::BurnParam};

use super::{contract_types::*, error::*, events::*, state::*};

#[receive(
    contract = "carbon_credits",
    name = "retract",
    parameter = "ContractBurnParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn retract<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let ContractBurnParams { owner, tokens } = ctx.parameter_cursor().get()?;
    let sender = ctx.sender();
    let is_verifier = host
        .state()
        .verifier_contracts
        .iter()
        .any(|vc| Client::is_verifier(host, sender, *vc).unwrap_or(false));

    ensure!(
        sender == owner || is_verifier,
        ContractError::Unauthorized
    );

    for BurnParam { token_id, amount } in tokens {
        let state = host.state();

        // Ensure that the token exists.
        ensure!(
            state.contains_token(&token_id),
            ContractError::InvalidTokenId
        );

        let (is_mature, is_verified) = {
            // Get Collateral Token Info
            let (collateral_key, _) = state
                .find_collateral(&token_id)
                .ok_or(CustomContractError::InvalidCollateral)?;

            // Get Maturity Time
            let maturity_of =
                Client::maturity_of(host, collateral_key.token_id, collateral_key.contract)?;
            let is_mature = maturity_of <= ctx.metadata().slot_time();
            // Get Verification Status
            let is_verified = Client::is_verified(host, token_id, collateral_key.contract)?;

            (is_mature, is_verified)
        };

        ensure!(
            !is_mature || !is_verified,
            CustomContractError::TokenVerifiedOrMature.into()
        );

        // Ensure that the sender has token balance
        let balance = state.balance(&token_id, &owner)?;
        ensure!(balance >= amount, ContractError::InsufficientFunds);

        // Retire token.
        host.state_mut().burn(&token_id, amount, &owner);

        // log token retire event.
        logger.log(&ContractEvent::Retract(BurnEvent {
            token_id,
            owner,
            amount,
        }))?;
        // log burn event
        logger.log(&ContractEvent::Burn(BurnEvent {
            token_id,
            owner,
            amount,
        }))?;
    }

    Ok(())
}
