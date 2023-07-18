use concordium_cis2::*;
use concordium_std::*;

use crate::client_utils::{client::Client, types::*};

use super::{contract_types::*, error::*, events::*, state::*};

/// This functions should be invoked by any CIS2 Contract whose token is being transferred.
/// TO this contract
///
/// Upon receiving any token its added to the collateral state of the contract.
/// Mint function can be called in a separate transaction to mint a token against the collateral.
///
/// It rejects if:
/// - Sender is not a contract.
/// - It fails to parse the parameter.
/// - Contract name part of the parameter is invalid.
/// - Calling back `transfer` to sender contract rejects.
#[receive(
    contract = "project_fractionalizer",
    name = "onCis2Recieved",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn on_cis2_received<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Ensure the sender is a contract.
    let sender = if let Address::Contract(contract) = ctx.sender() {
        contract
    } else {
        bail!(CustomContractError::ContractOnly.into())
    };

    // Parse the parameter.
    let params: OnReceivingCis2Params<ContractTokenId, TokenAmountU8> =
        ctx.parameter_cursor().get()?;

    let from_account = match params.from {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(CustomContractError::AccountsOnly.into()),
    };

    // Parse the Maturity time from the first 8 bytes of the data field.
    let maturity_time: Timestamp = Client::maturity_of(host, params.token_id, sender)?;

    // Ensure the maturity time is in past. ie the project NFT is mature.
    ensure!(
        maturity_time <= ctx.metadata().slot_time(),
        CustomContractError::InvalidCollateral.into()
    );

    let is_verified: bool =  Client::is_verified(host, params.token_id, sender)?;
    // Ensure the token is verified.
    ensure!(is_verified, CustomContractError::InvalidCollateral.into());

    host.state_mut()
        .add_collateral(sender, params.token_id, from_account, params.amount);
    logger.log(&ContractEvent::CollateralAdded(CollateralUpdatedEvent {
        amount: params.amount,
        contract: sender,
        token_id: params.token_id,
        owner: params.from,
    }))?;
    Ok(())
}
