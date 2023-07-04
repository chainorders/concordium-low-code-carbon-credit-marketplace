use concordium_cis2::{MetadataUrl, TransferEvent};
use concordium_std::*;

use super::contract_types::{ContractCollateralTokenAmount, ContractTokenAmount, ContractTokenId};

#[derive(Serial, SchemaType)]
pub struct MintEvent {
    pub token_id: ContractTokenId,
    pub metadata_url: MetadataUrl,
    pub owner: Address,
    pub amount: ContractTokenAmount,
}

#[derive(Serial, SchemaType)]
pub struct CollateralAddedEvent {
    pub contract: ContractAddress,
    pub token_id: ContractTokenId,
    pub amount: ContractCollateralTokenAmount,
    pub owner: Address,
}

#[derive(Serial, SchemaType)]
pub struct CollateralRemovedEvent {
    pub contract: ContractAddress,
    pub token_id: ContractTokenId,
    pub amount: ContractCollateralTokenAmount,
    pub owner: Address,
}

#[derive(Serial, SchemaType)]
pub struct RetireEvent {
    pub token_id: ContractTokenId,
    pub amount: ContractTokenAmount,
    pub owner: Address,
}

#[derive(Serial, SchemaType)]
pub enum ContractEvent {
    Mint(MintEvent),
    Transfer(TransferEvent<ContractTokenId, ContractTokenAmount>),
    Retire(RetireEvent),
    CollateralAdded(CollateralAddedEvent),
    CollateralRemoved(CollateralRemovedEvent),
}
