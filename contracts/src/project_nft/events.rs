use concordium_cis2::{MetadataUrl, TransferEvent};
use concordium_std::*;

use super::contract_types::*;

#[derive(Serial, SchemaType)]
pub struct MintEvent {
    pub token_id: ContractTokenId,
    pub maturity_time: Timestamp,
    pub owner: Address,
    pub metadata_url: MetadataUrl,
}

#[derive(Serial, SchemaType)]
pub struct RetireEvent {
    pub token_id: ContractTokenId,
    pub owner: Address,
}

#[derive(Serial, SchemaType)]
pub enum ContractEvent {
    Mint(MintEvent),
    Transfer(TransferEvent<ContractTokenId, ContractTokenAmount>),
    Retire(RetireEvent),
}
