use core::ops::{AddAssign, SubAssign};

use concordium_cis2::*;
use concordium_std::*;

use crate::cis2_utils::cis2_types::{ContractTokenAmount, ContractTokenId};

use super::{contract_types::*, error::*, token_metadata::TokenMetadata};

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
pub struct AddressState<S> {
    /// The amount of tokens owned by this address.
    pub balances: StateMap<ContractTokenId, ContractTokenAmount, S>,
}

impl<S: HasStateApi> AddressState<S> {
    fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        AddressState {
            balances: state_builder.new_map(),
        }
    }
}

/// Collateral Key.
/// The Token which is fractionalized and hence used as collateral.
#[derive(Serial, Deserial, Clone, SchemaType, Copy)]
pub struct CollateralToken {
    pub contract: ContractAddress,
    pub token_id: ContractTokenId,
    pub owner: AccountAddress,
}

#[derive(Serial, Deserial, Clone, Copy, SchemaType)]
pub struct CollateralState {
    pub received_token_amount: ContractCollateralTokenAmount,
    pub minted_token_id: Option<ContractTokenId>,
}

impl CollateralState {
    fn new() -> Self {
        CollateralState {
            received_token_amount: ContractCollateralTokenAmount::from(0),
            minted_token_id: Option::None,
        }
    }
}

/// The contract state,
///
/// Note: The specification does not specify how to structure the contract state
/// and this could be structured in a more space efficient way.
#[derive(Serial, DeserialWithState, StateClone)]
#[concordium(state_parameter = "S")]
pub struct State<S> {
    /// The state of addresses.
    pub state: StateMap<Address, AddressState<S>, S>,
    /// All of the token IDs
    pub tokens: StateMap<ContractTokenId, MetadataUrl, S>,
    pub token_supply: StateMap<ContractTokenId, ContractTokenAmount, S>,
    pub tokens_owned: StateMap<CollateralToken, CollateralState, S>,
}

impl<S: HasStateApi> State<S> {
    /// Construct a state with no tokens
    pub fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        State {
            state: state_builder.new_map(),
            tokens: state_builder.new_map(),
            tokens_owned: state_builder.new_map(),
            token_supply: state_builder.new_map(),
        }
    }

    /// Mints an amount of tokens with a given address as the owner.
    pub fn mint(
        &mut self,
        token_id: &ContractTokenId,
        token_metadata: &TokenMetadata,
        amount: ContractTokenAmount,
        owner: &Address,
        state_builder: &mut StateBuilder<S>,
    ) {
        self.tokens
            .insert(*token_id, token_metadata.to_metadata_url());

        self.state
            .entry(*owner)
            .and_modify(|b| {
                b.balances
                    .entry(*token_id)
                    .and_modify(|a| *a += amount)
                    .or_insert(amount);
            })
            .or_insert_with(|| AddressState::empty(state_builder));

        self.token_supply
            .entry(*token_id)
            .and_modify(|a| a.add_assign(amount))
            .or_insert(amount);
    }

    pub fn burn(
        &mut self,
        token_id: &ContractTokenId,
        amount: ContractTokenAmount,
        owner: &Address,
    ) {
        self.state.entry(owner.to_owned()).and_modify(|f| {
            f.balances
                .entry(*token_id)
                .and_modify(|a| a.sub_assign(amount));
        });

        self.token_supply
            .entry(*token_id)
            .and_modify(|a| a.sub_assign(amount));
    }

    /// Check that the token ID currently exists in this contract.
    #[inline(always)]
    pub fn contains_token(&self, token_id: &ContractTokenId) -> bool {
        self.tokens.get(token_id).is_some()
    }

    /// Get the current balance of a given token id for a given address.
    /// Results in an error if the token id does not exist in the state.
    pub fn balance(
        &self,
        token_id: &ContractTokenId,
        address: &Address,
    ) -> ContractResult<ContractTokenAmount> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        let balance = self.state.get(address).map_or(0.into(), |address_state| {
            address_state
                .balances
                .get(token_id)
                .map_or(0.into(), |x| *x)
        });
        Ok(balance)
    }

    pub fn get_supply(&self, token_id: &ContractTokenId) -> ContractTokenAmount {
        match self.token_supply.get(token_id) {
            Some(amount) => amount.to_owned(),
            None => ContractTokenAmount::from(0),
        }
    }

    /// Update the state with a transfer.
    /// Results in an error if the token id does not exist in the state or if
    /// the from address have insufficient tokens to do the transfer.
    pub fn transfer(
        &mut self,
        token_id: &ContractTokenId,
        amount: ContractTokenAmount,
        from: &Address,
        to: &Address,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        // A zero transfer does not modify the state.
        if amount == 0.into() {
            return Ok(());
        }

        // Get the `from` state and balance, if not present it will fail since the
        // balance is interpreted as 0 and the transfer amount must be more than
        // 0 as this point.;
        {
            let mut from_address_state = self
                .state
                .entry(*from)
                .occupied_or(ContractError::InsufficientFunds)?;
            let mut from_balance = from_address_state
                .balances
                .entry(*token_id)
                .occupied_or(ContractError::InsufficientFunds)?;
            ensure!(*from_balance >= amount, ContractError::InsufficientFunds);
            *from_balance -= amount;
        }

        let mut to_address_state = self
            .state
            .entry(*to)
            .or_insert_with(|| AddressState::empty(state_builder));
        let mut to_address_balance = to_address_state
            .balances
            .entry(*token_id)
            .or_insert(0.into());
        *to_address_balance += amount;

        Ok(())
    }

    pub fn add_owned_token(
        &mut self,
        contract: ContractAddress,
        token_id: ContractTokenId,
        owner: AccountAddress,
        received_token_amount: ContractCollateralTokenAmount,
    ) {
        let key = CollateralToken {
            contract,
            token_id,
            owner,
        };

        let mut cs = match self.tokens_owned.get(&key) {
            Some(v) => *v,
            None => CollateralState::new(),
        };

        cs.received_token_amount += received_token_amount;

        self.tokens_owned.insert(key, cs);
    }

    /// Returns false if the owned token is used for any token Id other than the token being minted.
    pub fn has_unsed_owned_token(
        &self,
        collateral_key: &CollateralToken,
        minted_token_id: &ContractTokenId,
    ) -> bool {
        match self.tokens_owned.get(collateral_key) {
            Some(c) => match c.minted_token_id {
                Some(minted_token) => minted_token.eq(minted_token_id),
                None => true,
            },
            None => false,
        }
    }

    pub fn find_owned_token_from_minted_token_id(
        &self,
        token_id: &ContractTokenId,
    ) -> Option<(CollateralToken, ContractCollateralTokenAmount)> {
        for c in self.tokens_owned.iter() {
            match c.1.minted_token_id {
                Some(t) => {
                    if t.eq(token_id) {
                        return Some((*c.0, c.1.received_token_amount));
                    }
                }
                None => continue,
            };
        }

        None
    }

    pub fn remove_owned_token(&mut self, collateral_key: &CollateralToken) {
        self.tokens_owned.remove(collateral_key);
    }

    /// Updates the owned token to attached a Minted Token Id
    pub fn use_owned_token(
        &mut self,
        owned_token: &CollateralToken,
        minted_token_id: &ContractTokenId,
    ) -> ContractResult<()> {
        match self.tokens_owned.entry(owned_token.to_owned()) {
            Entry::Vacant(_) => bail!(Cis2Error::Custom(CustomContractError::InvalidCollateral)),
            Entry::Occupied(mut e) => {
                e.modify(|s| s.minted_token_id = Some(minted_token_id.to_owned()));
                Ok(())
            }
        }
    }
}
