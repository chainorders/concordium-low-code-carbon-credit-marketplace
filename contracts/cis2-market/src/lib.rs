//! Marketplace Contract
//! This module provides implementation of the marketplace contract.
//! Marketplace Contract provides following functions
//! - `list` : returns a list of buyable tokens added to the contract instance.
//! - `add` : adds the token to the list of buyable tokens taking the price of
//!   the token as input.
//! - `transfer` : transfer the authority of the input listed token from one
//!   address to another.
//!
//! This code has not been checked for production readiness. Please use for
//! reference purposes
mod errors;
mod params;
mod state;

use std::ops::{Add, Mul};

use cis2_common_utils::{
    cis2_client::Cis2Client, ContractOnReceivingCis2Params, ContractTokenAmount,
};

use concordium_std::*;
use errors::MarketplaceError;
use params::{AddParams, InitParams, TokenList};
use state::{Commission, State, TokenInfo, TokenListItem, TokenOwnedListItem, TokenRoyaltyState};

use crate::{params::TransferParams, state::TokenOwnerInfo};

type ContractResult<A> = Result<A, MarketplaceError>;
type InitResult<S> = Result<State<S>, MarketplaceError>;

const MAX_BASIS_POINTS: u16 = 10000;

/// Type of state.
type ContractState<S> = State<S>;

/// Initializes a new Marketplace Contract
///
/// This function can be called by using InitParams.
/// The commission should be less than the maximum allowed value of 10000 basis
/// points
#[init(
    contract = "Market-NFT",
    parameter = "InitParams",
    error = "MarketplaceError"
)]
fn init<S: HasStateApi>(
    ctx: &impl HasInitContext,
    state_builder: &mut StateBuilder<S>,
) -> InitResult<S> {
    let params: InitParams = ctx.parameter_cursor().get()?;

    ensure!(
        params.commission.cmp(&MAX_BASIS_POINTS).is_le(),
        MarketplaceError::InvalidCommission
    );

    Ok(State::new(state_builder, params.commission))
}

/// Adds a new already owned token to the marketplace.
#[receive(
    contract = "Market-NFT",
    name = "add",
    parameter = "AddParams",
    mutable,
    error = "MarketplaceError"
)]
fn add<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<ContractState<S>, StateApiType = S>,
) -> ContractResult<()> {
    let sender_account_address: AccountAddress = match ctx.sender() {
        Address::Account(account_address) => account_address,
        Address::Contract(_) => bail!(MarketplaceError::CalledByAContract),
    };

    let params: AddParams = ctx.parameter_cursor().get()?;
    let token_info = TokenInfo {
        address: params.cis_contract_address,
        id: params.token_id,
    };

    let commission = host.state().commission.clone();

    // Ensure that the `commission + royalty` is less than the maximum allowed value of 10000
    ensure!(
        commission
            .percentage_basis
            .add(params.royalty)
            .cmp(&MAX_BASIS_POINTS)
            .is_le(),
        MarketplaceError::InvalidRoyalty
    );

    let owned_quantity = host
        .state()
        .get_quantity_owned(&token_info, &sender_account_address)?;
    // Ensure that the quantity owned is greater than 0
    ensure!(
        owned_quantity.cmp(&ContractTokenAmount::from(0)).is_ge(),
        MarketplaceError::InvalidTokenQuantity
    );

    let (state, state_builder) = host.state_and_builder();
    state.list_token(
        state_builder,
        &token_info,
        &sender_account_address,
        params.price,
        params.royalty,
    );

    Ok(())
}

/// Allows for transferring the token specified by TransferParams.
///
/// This function is the typical buuy function of a Marketplace where one
/// account can transfer an Asset by paying a price. The transfer will fail of
/// the Amount paid is < token_quantity * token_price
#[receive(
    contract = "Market-NFT",
    name = "transfer",
    parameter = "TransferParams",
    mutable,
    payable,
    error = "MarketplaceError"
)]
fn transfer<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<ContractState<S>, StateApiType = S>,
    amount: Amount,
) -> ContractResult<()> {
    let params: TransferParams = ctx.parameter_cursor().get()?;
    let token_info = &TokenInfo {
        id: params.token_id,
        address: params.cis_contract_address,
    };

    let quantity_owned = host
        .state()
        .get_quantity_owned(&token_info, &params.owner)?;

    ensure!(
        quantity_owned.cmp(&params.quantity).is_ge(),
        MarketplaceError::InvalidTokenQuantity
    );

    if ctx.sender() == Address::Account(params.owner) {
        ensure!(
            amount.cmp(&Amount::zero()).is_eq(),
            MarketplaceError::InvalidAmountPaid
        );
    } else {
        let (token_royalty_state, price_per_unit) =
            host.state().get_listed_token(token_info, &params.owner)?;
        let price = price_per_unit.mul(params.quantity.into());
        ensure!(
            amount.cmp(&price).is_ge(),
            MarketplaceError::InvalidAmountPaid
        );

        distribute_amounts(
            host,
            amount,
            &params.owner,
            &token_royalty_state,
            &ctx.owner(),
        )?;
    };

    Cis2Client::transfer(
        host,
        params.token_id,
        params.cis_contract_address,
        params.quantity,
        concordium_std::Address::Contract(ctx.self_address()),
        concordium_cis2::Receiver::Account(params.to),
    )?;

    host.state_mut().decrease_listed_quantity(
        &TokenOwnerInfo::from(token_info, &params.owner),
        params.quantity,
    );
    Ok(())
}

/// Returns a list of Added Tokens with Metadata which contains the token price
#[receive(
    contract = "Market-NFT",
    name = "list",
    return_value = "TokenList",
    error = "MarketplaceError"
)]
fn list<S: HasStateApi>(
    _ctx: &impl HasReceiveContext,
    host: &impl HasHost<ContractState<S>, StateApiType = S>,
) -> ContractResult<TokenList> {
    let tokens: Vec<TokenListItem> = host
        .state()
        .get_listed_tokens()
        .iter()
        .filter(|t| t.quantity.cmp(&ContractTokenAmount::from(0)).is_gt())
        .cloned()
        .collect::<Vec<TokenListItem>>();

    Ok(TokenList(tokens))
}

#[receive(
    contract = "Market-NFT",
    name = "list_owned",
    return_value = "Vec<TokenOwnedListItem>",
    error = "MarketplaceError"
)]
fn list_owned<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &impl HasHost<ContractState<S>, StateApiType = S>,
) -> ContractResult<Vec<TokenOwnedListItem>> {
    let sender = ctx.sender();

    let list = host
        .state()
        .tokens_owned
        .iter()
        .filter(|f| sender.matches_account(&f.0.owner))
        .filter(|f| {
            match host.state().tokens_listed.get(&TokenInfo {
                address: f.0.address,
                id: f.0.id,
            }) {
                Some(token) => token.token_prices.get(&f.0.owner).is_none(),
                None => true,
            }
        })
        .map(|f| TokenOwnedListItem {
            contract: f.0.address,
            token_id: f.0.id,
            owner: f.0.owner,
            quantity: f.1.clone(),
        })
        .collect();

    Ok(list)
}

/// This functions should be invoked by any CIS2 Contract whose token is being transferred.
/// TO this contract
///
/// Upon receiving any token its added to the list of owned tokens.
/// `add` function can be called in a separate transaction to mint a token against the collateral.
///
/// It rejects if:
/// - Sender is not a contract.
/// - It fails to parse the parameter.
/// - Contract name part of the parameter is invalid.
/// - Calling back `transfer` to sender contract rejects.
#[receive(
    contract = "Market-NFT",
    name = "recieve_cis2",
    error = "MarketplaceError",
    mutable
)]
fn recieve_cis2<S: HasStateApi>(
    ctx: &impl HasReceiveContext,
    host: &mut impl HasHost<State<S>, StateApiType = S>,
) -> ContractResult<()> {
    // Ensure the sender is a contract.
    let token_contract = match ctx.sender() {
        Address::Contract(contract) => contract,
        _ => bail!(MarketplaceError::CalledByAnAccount),
    };

    // Parse the parameter.
    let params: ContractOnReceivingCis2Params = ctx.parameter_cursor().get()?;

    let token_owner = match params.from {
        Address::Account(a) => a,
        Address::Contract(_) => bail!(MarketplaceError::CalledByAContract),
    };

    host.state_mut().add_owned_token(
        &TokenOwnerInfo {
            id: params.token_id,
            address: token_contract,
            owner: token_owner,
        },
        params.amount,
    );

    Ok(())
}

struct DistributableAmounts {
    to_primary_owner: Amount,
    to_seller: Amount,
    to_marketplace: Amount,
}

// Distributes Selling Price, Royalty & Commission amounts.
fn distribute_amounts<S: HasStateApi>(
    host: &mut impl HasHost<State<S>, StateApiType = S>,
    amount: Amount,
    token_owner: &AccountAddress,
    token_royalty_state: &TokenRoyaltyState,
    marketplace_owner: &AccountAddress,
) -> Result<(), MarketplaceError> {
    let amounts = calculate_amounts(
        &amount,
        &host.state().commission,
        token_royalty_state.royalty,
    );

    if amounts.to_seller.cmp(&Amount::zero()).is_gt() {
        host.invoke_transfer(token_owner, amounts.to_seller)
            .map_err(|_| MarketplaceError::InvokeTransferError)?;
    }

    if amounts.to_marketplace.cmp(&Amount::zero()).is_gt() {
        host.invoke_transfer(marketplace_owner, amounts.to_marketplace)
            .map_err(|_| MarketplaceError::InvokeTransferError)?;
    }

    if amounts.to_primary_owner.cmp(&Amount::zero()).is_gt() {
        host.invoke_transfer(&token_royalty_state.primary_owner, amounts.to_primary_owner)
            .map_err(|_| MarketplaceError::InvokeTransferError)?;
    };

    Ok(())
}

/// Calculates the amounts (Commission, Royalty & Selling Price) to be
/// distributed
fn calculate_amounts(
    amount: &Amount,
    commission: &Commission,
    royalty_percentage_basis: u16,
) -> DistributableAmounts {
    let commission_amount =
        (*amount * commission.percentage_basis.into()).quotient_remainder(MAX_BASIS_POINTS.into());

    let royalty_amount =
        (*amount * royalty_percentage_basis.into()).quotient_remainder(MAX_BASIS_POINTS.into());

    DistributableAmounts {
        to_seller: amount
            .subtract_micro_ccd(commission_amount.0.micro_ccd())
            .subtract_micro_ccd(royalty_amount.0.micro_ccd()),
        to_marketplace: commission_amount.0,
        to_primary_owner: royalty_amount.0,
    }
}

#[concordium_cfg_test]
mod test {
    use crate::{
        add, calculate_amounts,
        errors::MarketplaceError,
        init, list,
        params::AddParams,
        recieve_cis2,
        state::{Commission, State, TokenInfo, TokenListState, TokenOwnerInfo, TokenRoyaltyState},
    };
    use cis2_common_utils::*;

    use concordium_cis2::AdditionalData;
    use concordium_std::{test_infrastructure::*, *};

    const ACCOUNT_0: AccountAddress = AccountAddress([0u8; 32]);
    const ADDRESS_0: Address = Address::Account(ACCOUNT_0);
    const CIS_CONTRACT_ADDRESS: ContractAddress = ContractAddress {
        index: 1,
        subindex: 0,
    };
    const MARKET_CONTRACT_ADDRESS: ContractAddress = ContractAddress {
        index: 2,
        subindex: 0,
    };

    #[concordium_test]
    fn should_init_contract() {
        let mut ctx = TestInitContext::default();
        let mut state_builder = TestStateBuilder::new();

        let state = State::new(&mut state_builder, 250);
        let host = TestHost::new(state, state_builder);

        let init_params = crate::params::InitParams { commission: 250 };

        let parameter_bytes = to_bytes(&init_params);
        ctx.set_parameter(&parameter_bytes);

        let result = init(&ctx, &mut TestStateBuilder::new());

        assert!(result.is_ok());
        assert_eq!(
            host.state().commission.percentage_basis,
            init_params.commission
        );
    }

    #[concordium_test]
    fn should_add_token() {
        let token_id_1 = ContractTokenId::from(1);
        let token_quantity_1 = ContractTokenAmount::from(1);
        let price = Amount::from_ccd(1);

        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(ADDRESS_0);
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let add_params = AddParams {
            cis_contract_address: CIS_CONTRACT_ADDRESS,
            price,
            token_id: token_id_1,
            royalty: 0,
        };
        let parameter_bytes = to_bytes(&add_params);
        ctx.set_parameter(&parameter_bytes);

        let mut state_builder = TestStateBuilder::new();
        let mut state = State::new(&mut state_builder, 250);
        state.add_owned_token(
            &TokenOwnerInfo {
                id: token_id_1,
                address: CIS_CONTRACT_ADDRESS,
                owner: ACCOUNT_0,
            },
            token_quantity_1,
        );

        let mut host = TestHost::new(state, state_builder);

        let result = add(&ctx, &mut host);

        assert!(result.is_ok());
        assert!(host
            .state()
            .tokens_listed
            .get(&TokenInfo {
                address: CIS_CONTRACT_ADDRESS,
                id: token_id_1
            })
            .is_some());

        let listed_token = host
            .state()
            .tokens_listed
            .get(&TokenInfo {
                address: CIS_CONTRACT_ADDRESS,
                id: token_id_1,
            })
            .unwrap();
        assert_eq!(
            listed_token.token_royalty,
            TokenRoyaltyState {
                primary_owner: ACCOUNT_0,
                royalty: 0
            }
        );
        assert_eq!(
            listed_token
                .token_prices
                .get(&ACCOUNT_0)
                .unwrap()
                .to_owned(),
            price
        );
    }

    #[concordium_test]
    fn should_not_add_not_owned_token() {
        let token_id_1 = ContractTokenId::from(1);
        let price = Amount::from_ccd(1);

        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(ADDRESS_0);
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let add_params = AddParams {
            cis_contract_address: CIS_CONTRACT_ADDRESS,
            price,
            token_id: token_id_1,
            royalty: 0,
        };
        let parameter_bytes = to_bytes(&add_params);
        ctx.set_parameter(&parameter_bytes);

        let mut state_builder = TestStateBuilder::new();
        let state = State::new(&mut state_builder, 250);
        let mut host = TestHost::new(state, state_builder);

        let result = add(&ctx, &mut host);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), MarketplaceError::TokenNotInCustody);
    }

    #[concordium_test]
    fn should_recieve_cis2() {
        // Tests that the contract can receive cis2 tokens
        let token_id_1 = ContractTokenId::from(1);
        let token_quantity_1 = ContractTokenAmount::from(1);

        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(Address::Contract(CIS_CONTRACT_ADDRESS));
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let params = ContractOnReceivingCis2Params {
            token_id: token_id_1,
            amount: token_quantity_1,
            from: Address::Account(ACCOUNT_0),
            data: AdditionalData::empty(),
        };
        let parameter_bytes = to_bytes(&params);
        ctx.set_parameter(&parameter_bytes);

        let mut state_builder = TestStateBuilder::new();
        let state = State::new(&mut state_builder, 250);
        let mut host = TestHost::new(state, state_builder);

        let result = recieve_cis2(&ctx, &mut host);
        assert!(result.is_ok());
        assert!(host
            .state()
            .tokens_owned
            .get(&TokenOwnerInfo {
                id: token_id_1,
                address: CIS_CONTRACT_ADDRESS,
                owner: ACCOUNT_0,
            })
            .is_some());
    }

    #[concordium_test]
    fn should_list_tokens() {
        let mut ctx = TestReceiveContext::default();
        ctx.set_sender(ADDRESS_0);
        ctx.set_self_address(MARKET_CONTRACT_ADDRESS);

        let mut state_builder = TestStateBuilder::new();
        let mut state = State::new(&mut state_builder, 250);
        state.add_owned_token(
            &TokenOwnerInfo {
                id: ContractTokenId::from(1),
                address: CIS_CONTRACT_ADDRESS,
                owner: ACCOUNT_0,
            },
            ContractTokenAmount::from(1),
        );
        state.add_owned_token(
            &TokenOwnerInfo {
                id: ContractTokenId::from(2),
                address: CIS_CONTRACT_ADDRESS,
                owner: ACCOUNT_0,
            },
            ContractTokenAmount::from(1),
        );
        state.tokens_listed.insert(
            TokenInfo {
                address: CIS_CONTRACT_ADDRESS,
                id: ContractTokenId::from(1),
            },
            TokenListState {
                token_royalty: TokenRoyaltyState {
                    primary_owner: ACCOUNT_0,
                    royalty: 0,
                },
                token_prices: {
                    let mut map = state_builder.new_map();
                    map.insert(ACCOUNT_0, Amount::from_ccd(1));
                    map
                },
            },
        );

        let result = list(&ctx, &mut TestHost::new(state, state_builder));
        assert!(result.is_ok());
        let tokens_list = result.unwrap();
        assert_eq!(tokens_list.0.len(), 1);
        assert_eq!(tokens_list.0[0].token_id, ContractTokenId::from(1));
        assert_eq!(tokens_list.0[0].price, Amount::from_ccd(1));
        assert_eq!(tokens_list.0[0].royalty, 0);
        assert_eq!(tokens_list.0[0].primary_owner, ACCOUNT_0);
        assert_eq!(tokens_list.0[0].contract, CIS_CONTRACT_ADDRESS);
    }

    #[concordium_test]
    fn calculate_commissions_test() {
        let commission_percentage_basis: u16 = 250;
        let royalty_percentage_basis: u16 = 1000;
        let init_amount = Amount::from_ccd(11);
        let distributable_amounts = calculate_amounts(
            &init_amount,
            &Commission {
                percentage_basis: commission_percentage_basis,
            },
            royalty_percentage_basis,
        );

        claim_eq!(
            distributable_amounts.to_seller,
            Amount::from_micro_ccd(9625000)
        );
        claim_eq!(
            distributable_amounts.to_marketplace,
            Amount::from_micro_ccd(275000)
        );
        claim_eq!(
            distributable_amounts.to_primary_owner,
            Amount::from_micro_ccd(1100000)
        );
        claim_eq!(
            init_amount,
            Amount::from_ccd(0)
                .add_micro_ccd(distributable_amounts.to_seller.micro_ccd())
                .add_micro_ccd(distributable_amounts.to_marketplace.micro_ccd())
                .add_micro_ccd(distributable_amounts.to_primary_owner.micro_ccd())
        )
    }
}
