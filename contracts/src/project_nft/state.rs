use concordium_cis2::*;
use concordium_std::*;

use super::{contract_types::*, mint::MintParam, error::*};

/// The state for each address.
#[derive(Serial, DeserialWithState, Deletable, StateClone)]
#[concordium(state_parameter = "S")]
pub struct AddressState<S> {
    /// The amount of tokens owned by this address.
    pub balances: StateMap<ContractTokenId, ContractTokenAmount, S>,
}

#[derive(Serial, Deserial, Clone)]
pub struct TokenState {
    pub metadata_url: MetadataUrl,
    pub maturity_time: Timestamp,
}

impl TokenState {
    pub fn is_mature(&self, now: &Timestamp) -> bool {
        self.maturity_time.cmp(now).is_le()
    }
}

impl From<&MintParam> for TokenState {
    fn from(mint_param: &MintParam) -> Self {
        TokenState {
            metadata_url: mint_param.metadata_url.clone(),
            maturity_time: mint_param.maturity_time,
        }
    }
}

impl<S: HasStateApi> AddressState<S> {
    pub fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        AddressState {
            balances: state_builder.new_map(),
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
    pub addresses: StateMap<Address, StateSet<ContractTokenId, S>, S>,
    /// All of the token IDs
    pub tokens: StateMap<ContractTokenId, TokenState, S>,
    pub last_token_id: ContractTokenId,
}

impl<S: HasStateApi> State<S> {
    /// Construct a state with no tokens
    pub fn empty(state_builder: &mut StateBuilder<S>) -> Self {
        State {
            addresses: state_builder.new_map(),
            tokens: state_builder.new_map(),
            last_token_id: 0.into(),
        }
    }

    /// Mints an amount of tokens with a given address as the owner.
    pub fn mint(
        &mut self,
        mint_param: &MintParam,
        owner: &Address,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractTokenId {
        let token_id = self.last_token_id;
        // Add the token to the contract state.
        self.tokens.insert(token_id, TokenState::from(mint_param));
        // Add the token to the owner's state.
        self.add(owner, state_builder, token_id);
        // Increment the token ID for the next mint.
        self.last_token_id = ContractTokenId::from(token_id.0 + 1);

        // Return the token ID.
        token_id
    }

    fn add(&mut self, owner: &Address, state_builder: &mut StateBuilder<S>, token_id: TokenIdU8) {
        let mut owner_state = self
            .addresses
            .entry(*owner)
            .or_insert_with(|| state_builder.new_set());
        owner_state.insert(token_id);
    }

    /// Check that the token ID currently exists in this contract.
    #[inline(always)]
    pub fn contains_token(&self, token_id: &ContractTokenId) -> bool {
        self.get_token(token_id).is_some()
    }

    pub fn get_token(&self, token_id: &ContractTokenId) -> Option<TokenState> {
        self.tokens.get(token_id).map(|x| x.to_owned())
    }

    /// Get the current balance of a given token id for a given address.
    /// Results in an error if the token id does not exist in the state.
    pub fn balance(
        &self,
        token_id: &ContractTokenId,
        address: &Address,
    ) -> ContractResult<ContractTokenAmount> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        let balance = self
            .addresses
            .get(address)
            .map_or(0, |address_state| match address_state.contains(token_id) {
                true => 1,
                false => 0,
            })
            .into();

        Ok(balance)
    }

    /// Update the state with a transfer.
    /// Results in an error if the token id does not exist in the state or if
    /// the from address have insufficient tokens to do the transfer.
    pub fn transfer(
        &mut self,
        token_id: &ContractTokenId,
        from: &Address,
        to: &Address,
        state_builder: &mut StateBuilder<S>,
    ) -> ContractResult<()> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);
        ensure!(
            self.balance(token_id, from)?.cmp(&0.into()).is_gt(),
            ContractError::InsufficientFunds
        );
        if from == to {
            return Ok(());
        }

        // Remove token from from address.
        self.remove(from, token_id)?;

        // Add token to to address.
        self.add(to, state_builder, *token_id);

        Ok(())
    }

    pub fn burn(&mut self, token_id: &ContractTokenId, address: &Address) -> ContractResult<()> {
        ensure!(self.contains_token(token_id), ContractError::InvalidTokenId);

        // Remove token from address.
        self.remove(address, token_id)?;

        // Should we remove token from state if balance is zero?
        self.tokens.remove(token_id);

        Ok(())
    }

    /// Remove a token from an address.
    fn remove(
        &mut self,
        address: &Address,
        token_id: &TokenIdU8,
    ) -> Result<(), Cis2Error<super::error::CustomContractError>> {
        self.addresses
            .get_mut(address)
            .ok_or(ContractError::InsufficientFunds)?
            .remove(token_id);
        Ok(())
    }
}
