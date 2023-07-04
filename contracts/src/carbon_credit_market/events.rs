use concordium_std::{Address, ContractAddress, Amount, SchemaType, Serial};

use crate::project_fractionalizer::contract_types::{ContractTokenAmount, ContractTokenId};

#[derive(Serial, SchemaType)]
pub struct TokenTokenReceivedEvent {
    pub token_id: ContractTokenId,
    pub token_contract: ContractAddress,
    pub owner: Address,
    pub amount: ContractTokenAmount,
}

#[derive(Serial, SchemaType)]
pub struct TokenListedEvent {
    pub token_id: ContractTokenId,
    pub token_contract: ContractAddress,
    pub amount: ContractTokenAmount,
    pub price: Amount
}

#[derive(Serial, SchemaType)]
pub struct TokenTransferredEvent {
    pub token_id: ContractTokenId,
    pub token_contract: ContractAddress,
    pub from: Address,
    pub to: Address,
    pub amount: ContractTokenAmount,
}

#[derive(Serial, SchemaType)]
pub enum ContractEvent {
    TokenReceived(TokenTokenReceivedEvent),
    TokenListed(TokenListedEvent),
    TokenTransferred(TokenTransferredEvent),
}
