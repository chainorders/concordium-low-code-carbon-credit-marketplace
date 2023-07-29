use concordium_cis2::{Cis2Error, OnReceivingCis2Params, Receiver, Transfer, TransferParams};
use concordium_std::*;

use super::{contract_types::*, error::*, events::*, state::*};

/// Execute a list of token transfers, in the order of the list.
/// If the transfer is to the self address the tokens are burned instead.
/// If the balance after burning is zero then the collateral is returned back to the original sender.
///
/// Logs a `Transfer` event and invokes a receive hook function for every
/// transfer in the list.
///
/// It rejects if:
/// - It fails to parse the parameter.
/// - Any of the transfers fail to be executed, which could be if:
///     - The `token_id` does not exist.
///     - The sender is not the owner of the token, or an operator for this
///       specific `token_id` and `from` address.
///     - The token is not owned by the `from`.
/// - Fails to log event.
/// - Any of the receive hook function calls rejects.
#[receive(
    contract = "carbon_credits",
    name = "transfer",
    parameter = "TransferParameter",
    error = "ContractError",
    enable_logger,
    mutable
)]
fn contract_transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    // Parse the parameter.
    let TransferParams(transfers): TransferParameter = ctx.parameter_cursor().get()?;
    // Get the sender who invoked this contract function.
    let sender = ctx.sender();

    for Transfer {
        token_id,
        amount,
        from,
        to,
        data,
    } in transfers
    {
        let (state, builder) = host.state_and_builder();
        // Authenticate the sender for this transfer
        ensure!(from == sender, ContractError::Unauthorized);

        let to_address = to.address();

        if to_address.matches_contract(&ctx.self_address()) {
            let balance = state.balance(&token_id, &from)?;
            ensure!(balance >= amount, Cis2Error::InsufficientFunds);
            // tokens are being transferred to self
            // burn the tokens
            state.burn(&token_id, amount, &from);

            // log burn event
            logger.log(&ContractEvent::Retire(BurnEvent {
                token_id,
                amount,
                owner: from,
            }))?;

            // Check of there is any remaining amount
            if state
                .get_supply(&token_id)
                .eq(&ContractTokenAmount::from(0))
            {
                // Everything has been burned
                // Transfer collateral back to the original owner
                let (collateral_key, _collateral_amount) = state
                    .find_collateral(&token_id)
                    .ok_or(Cis2Error::Custom(CustomContractError::InvalidCollateral))?;

                // Remove the collateral from the state
                state.remove_collateral(&collateral_key);
                logger.log(&ContractEvent::CollateralRemoved(CollateralUpdatedEvent {
                    amount: _collateral_amount,
                    contract: collateral_key.contract,
                    token_id: collateral_key.token_id,
                    owner: concordium_std::Address::Account(collateral_key.owner),
                }))?;
                // Return back the collateral
                // Cis2Client::transfer(
                //     host,
                //     collateral_key.token_id,
                //     collateral_key.contract,
                //     collateral_amount,
                //     concordium_std::Address::Contract(ctx.self_address()),
                //     concordium_cis2::Receiver::Account(collateral_key.owner),
                // )
                // .map_err(CustomContractError::Cis2ClientError)?;
            }
        } else {
            // Tokens are being transferred to another address
            // Update the contract state
            state.transfer(&token_id, amount, &from, &to_address, builder)?;

            // Log transfer event
            logger.log(&ContractEvent::Transfer(super::events::TransferEvent {
                token_id,
                amount,
                from,
                to: to_address,
            }))?;

            // If the receiver is a contract we invoke it.
            if let Receiver::Contract(address, entrypoint_name) = to {
                let parameter = OnReceivingCis2Params {
                    token_id,
                    amount,
                    from,
                    data,
                };
                host.invoke_contract(
                    &address,
                    &parameter,
                    entrypoint_name.as_entrypoint_name(),
                    Amount::zero(),
                )?;
            }
        }
    }

    Ok(())
}
