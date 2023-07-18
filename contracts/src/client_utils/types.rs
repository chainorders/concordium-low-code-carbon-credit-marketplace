use concordium_cis2::*;
use concordium_std::*;

/// Type of token Id used by the CIS2 contract.
pub type ContractTokenId = TokenIdU8;
/// Type of Token Amount used by the CIS2 contract.
pub type ContractTokenAmount = TokenAmountU64;
pub type ContractOnReceivingCis2Params =
    OnReceivingCis2Params<ContractTokenId, ContractTokenAmount>;

#[derive(SchemaType, Serial, Deserial, Clone)]
pub struct ContractMetadataUrl {
    pub url: String,
    pub hash: Option<String>,
}

impl Into<MetadataUrl> for ContractMetadataUrl {
    fn into(self) -> MetadataUrl {
        MetadataUrl {
            url: self.url,
            hash: {
                if let Some(hash) = self.hash {
                    let mut hash_bytes = [0u8; 32];
                    match hex::decode_to_slice(hash, &mut hash_bytes) {
                        Ok(_) => Some(hash_bytes),
                        Err(_) => None,
                    }
                } else {
                    None
                }
            },
        }
    }
}

#[derive(Deserial, Serial, SchemaType)]
pub struct MaturityOfQueryParams<T: IsTokenId> {
    pub queries: Vec<T>,
}

pub type MaturityOfQueryResponse = Vec<Timestamp>;

#[derive(Deserial, Serial, SchemaType)]
pub struct IsVerifiedQueryParams<T: IsTokenId> {
    pub queries: Vec<T>,
}

pub type IsVerifiedQueryResponse = Vec<bool>;
