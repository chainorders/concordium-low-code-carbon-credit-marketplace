use concordium_std::*;

use super::{
    contract_types::{ContractResult, ContractTokenId},
    error::*,
    events::*,
    state::State,
};

#[derive(Deserial, Serial, SchemaType)]
pub struct AddVerifierParams {
    pub verifier: Address,
}

#[receive(
    contract = "project_nft",
    name = "addVerifier",
    parameter = "AddVerifierParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn add_verifier<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let AddVerifierParams { verifier } = ctx.parameter_cursor().get()?;
    let state = host.state_mut();
    // Authenticate the sender for this transfer
    ensure!(
        ctx.sender().matches_account(&ctx.owner()),
        ContractError::Unauthorized
    );
    // Update the contract state
    state.add_verifier(&verifier);
    logger.log(&ContractEvent::VerifierAdded(VerifierUpdatedEvent {
        verifier,
    }))?;

    return Ok(());
}

#[derive(Deserial, Serial, SchemaType)]
pub struct RemoveVerifierParams {
    pub verifier: Address,
}

#[receive(
    contract = "project_nft",
    name = "removeVerifier",
    parameter = "RemoveVerifierParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn remove_verifier<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let RemoveVerifierParams { verifier } = ctx.parameter_cursor().get()?;
    let state = host.state_mut();
    // Authenticate the sender for this transfer
    ensure!(
        ctx.sender().matches_account(&ctx.owner()),
        ContractError::Unauthorized
    );
    // Update the contract state
    state.remove_verifier(&verifier);
    logger.log(&ContractEvent::VerifierRemoved(VerifierUpdatedEvent {
        verifier,
    }))?;

    return Ok(());
}

#[derive(Deserial, Serial, SchemaType)]
pub struct VerifyParams {
    pub token_id: ContractTokenId,
}

#[receive(
    contract = "project_nft",
    name = "verify",
    parameter = "VerifyParams",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn verify<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let verifier = ctx.sender();
    // Parse the parameter.
    let VerifyParams { token_id } = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let (state, builder) = host.state_and_builder();
    // Authenticate the sender for this transfer
    ensure!(state.is_verifier(&verifier), ContractError::Unauthorized);
    // Update the contract state
    state.verify_token(&token_id, &verifier, builder);
    // Log the event
    logger.log(&ContractEvent::Verification(VerificationEvent {
        token_id,
        verifier,
    }))?;

    return Ok(());
}

#[derive(Deserial, Serial, SchemaType)]
pub struct IsVerifiedParams {
    token_id: ContractTokenId,
}

#[receive(
    contract = "project_nft",
    name = "isVerified",
    parameter = "IsVerifiedParams",
    error = "ContractError",
    mutable
)]
fn is_verified<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<bool> {
    // Parse the parameter.
    let IsVerifiedParams { token_id } = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let state = host.state();
    // Update the contract state
    return Ok(state.is_verified(&token_id));
}
