use concordium_cis2::{MetadataUrl, MINT_EVENT_TAG, TOKEN_METADATA_EVENT_TAG, TRANSFER_EVENT_TAG};
use concordium_std::{collections::BTreeMap, schema::SchemaType, *};

use super::contract_types::{ContractCollateralTokenAmount, ContractTokenAmount, ContractTokenId};
pub type TransferEvent = concordium_cis2::TransferEvent<ContractTokenId, ContractTokenAmount>;
pub type TokenMetadataEvent = concordium_cis2::TokenMetadataEvent<ContractTokenId>;
pub type MintEvent = concordium_cis2::MintEvent<ContractTokenId, ContractTokenAmount>;

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
    pub owner: Address,
    pub amount: ContractTokenAmount,
}

pub enum ContractEvent {
    Mint(MintEvent),
    TokenMetadata(TokenMetadataEvent),
    Transfer(TransferEvent),
    Retire(RetireEvent),
    CollateralAdded(CollateralAddedEvent),
    CollateralRemoved(CollateralRemovedEvent),
}

const RETIRE_EVENT_TAG: u8 = u8::MIN;
const COLLATERAL_ADDED_EVENT_TAG: u8 = u8::MIN + 1;
const COLLATERAL_REMOVED_EVENT_TAG: u8 = u8::MIN + 2;

impl Serial for ContractEvent {
    fn serial<W: Write>(&self, out: &mut W) -> Result<(), W::Err> {
        match self {
            ContractEvent::Transfer(event) => {
                out.write_u8(concordium_cis2::TRANSFER_EVENT_TAG)?;
                event.serial(out)
            }
            ContractEvent::Mint(event) => {
                out.write_u8(concordium_cis2::MINT_EVENT_TAG)?;
                event.serial(out)
            }
            ContractEvent::TokenMetadata(event) => {
                out.write_u8(concordium_cis2::TOKEN_METADATA_EVENT_TAG)?;
                event.serial(out)
            }
            ContractEvent::Retire(event) => {
                out.write_u8(RETIRE_EVENT_TAG)?;
                event.serial(out)
            }
            ContractEvent::CollateralAdded(event) => {
                out.write_u8(COLLATERAL_ADDED_EVENT_TAG)?;
                event.serial(out)
            }
            ContractEvent::CollateralRemoved(event) => {
                out.write_u8(COLLATERAL_REMOVED_EVENT_TAG)?;
                event.serial(out)
            }
        }
    }
}

impl SchemaType for ContractEvent {
    fn get_type() -> schema::Type {
        let mut event_map = BTreeMap::new();
        event_map.insert(
            TRANSFER_EVENT_TAG,
            (
                "Transfer".to_string(),
                schema::Fields::Named(vec![
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (String::from("amount"), ContractTokenAmount::get_type()),
                    (String::from("from"), Address::get_type()),
                    (String::from("to"), Address::get_type()),
                ]),
            ),
        );
        event_map.insert(
            MINT_EVENT_TAG,
            (
                "Mint".to_string(),
                schema::Fields::Named(vec![
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (String::from("amount"), ContractTokenAmount::get_type()),
                    (String::from("owner"), Address::get_type()),
                ]),
            ),
        );
        event_map.insert(
            TOKEN_METADATA_EVENT_TAG,
            (
                "TokenMetadata".to_string(),
                schema::Fields::Named(vec![
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (String::from("metadata_url"), MetadataUrl::get_type()),
                ]),
            ),
        );
        event_map.insert(
            RETIRE_EVENT_TAG,
            (
                "Retire".to_string(),
                schema::Fields::Named(vec![
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (String::from("owner"), Address::get_type()),
                    (String::from("amount"), ContractTokenAmount::get_type()),
                ]),
            ),
        );
        event_map.insert(
            COLLATERAL_ADDED_EVENT_TAG,
            (
                "CollateralAdded".to_string(),
                schema::Fields::Named(vec![
                    (String::from("contract"), ContractAddress::get_type()),
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (
                        String::from("amount"),
                        ContractCollateralTokenAmount::get_type(),
                    ),
                    (String::from("owner"), Address::get_type()),
                ]),
            ),
        );
        event_map.insert(
            COLLATERAL_REMOVED_EVENT_TAG,
            (
                "CollateralRemoved".to_string(),
                schema::Fields::Named(vec![
                    (String::from("contract"), ContractAddress::get_type()),
                    (String::from("token_id"), ContractTokenId::get_type()),
                    (
                        String::from("amount"),
                        ContractCollateralTokenAmount::get_type(),
                    ),
                    (String::from("owner"), Address::get_type()),
                ]),
            ),
        );
        schema::Type::TaggedEnum(event_map)
    }
}
