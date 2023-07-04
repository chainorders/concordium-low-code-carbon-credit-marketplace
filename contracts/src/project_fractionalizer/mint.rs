use concordium_cis2::Cis2Error;
use concordium_std::*;

use crate::cis2_utils::cis2_types::{ContractTokenAmount, ContractTokenId};

use super::{
    contract_types::ContractResult, error::CustomContractError, state::*,
    token_metadata::TokenMetadata, events::*
};

#[derive(Serial, Deserial, SchemaType)]
pub struct TokenMintParams {
    pub metadata: TokenMetadata,
    pub amount: ContractTokenAmount,
    /// Collateral Contract
    pub contract: ContractAddress,
    /// Collateral Token
    pub token_id: ContractTokenId,
}

/// The parameter for the contract function `mint` which mints a number of
/// token types and/or amounts of tokens to a given address.
#[derive(Serial, Deserial, SchemaType)]
pub struct MintParams {
    /// Owner of the newly minted tokens.
    pub owner: Address,
    /// A collection of tokens to mint.
    pub tokens: collections::BTreeMap<ContractTokenId, TokenMintParams>,
}

/// Mint new tokens with a given address as the owner of these tokens.
/// Can only be called by the contract owner.
/// Logs a `Mint` and a `TokenMetadata` event for each token.
/// The url for the token metadata is the token ID encoded in hex, appended on
/// the `TOKEN_METADATA_BASE_URL`.
///
/// It rejects if:
/// - The sender is not the contract instance owner.
/// - Fails to parse parameter.
/// - Any of the tokens fails to be minted, which could be if:
///     - Fails to log Mint event.
///     - Fails to log TokenMetadata event.
///
/// Note: Can at most mint 32 token types in one call due to the limit on the
/// number of logs a smart contract can produce on each function call.
#[receive(
    contract = "project_fractionalizer",
    name = "mint",
    parameter = "MintParams",
    error = "super::error::ContractError",
    enable_logger,
    mutable
)]
pub fn mint<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    logger: &mut impl HasLogger,
) -> ContractResult<()> {
    let sender = match ctx.sender() {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(CustomContractError::AccountsOnly.into()),
    };

    // Parse the parameter.
    let params: MintParams = ctx.parameter_cursor().get()?;

    let (state, builder) = host.state_and_builder();
    for (token_id, token_info) in params.tokens {
        ensure!(
            state.has_unsed_owned_token(
                &CollateralToken {
                    contract: token_info.contract,
                    token_id: token_info.token_id,
                    owner: sender,
                },
                &token_id
            ),
            concordium_cis2::Cis2Error::Custom(CustomContractError::InvalidCollateral)
        );

        // Ensure that the token ID is not already in use.
        ensure!(!state.contains_token(&token_id), Cis2Error::InvalidTokenId);

        // Mint the token in the state.
        state.mint(
            &token_id,
            &token_info.metadata,
            token_info.amount,
            &params.owner,
            builder,
        );

        state.use_owned_token(
            &CollateralToken {
                contract: token_info.contract,
                token_id: token_info.token_id,
                owner: sender,
            },
            &token_id,
        )?;

        // Event for minted token.
        logger.log(&ContractEvent::Mint(MintEvent {
            token_id,
            amount: token_info.amount,
            owner: params.owner,
            metadata_url: token_info.metadata.to_metadata_url(),
        }))?;
    }
    Ok(())
}
