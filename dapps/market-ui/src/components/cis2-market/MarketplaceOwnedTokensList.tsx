import { CIS2Contract, ConcordiumGRPCClient } from "@concordium/web-sdk";
import { MARKETPLACE_CONTRACT_INFO, MARKET_CONTRACT_ADDRESS } from "../../Constants";
import { useParamsContractAddress } from "../utils";
import { useEffect, useState } from "react";
import { OwnedTokenListItem, listOwned } from "../../models/MarketplaceClient";
import { ImageList, Typography } from "@mui/material";
import MarketplaceOwnedTokensListItem from "../MarketplaceOwnedTokensListItem";

type ListItem = OwnedTokenListItem & { cis2Contract: CIS2Contract };

export default function MarketplaceOwnedTokensList(props: {
  onSelected: (item: ListItem) => void;
  grpcClient: ConcordiumGRPCClient;
  account: string;
}) {
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const [tokens, setTokens] = useState<ListItem[]>([]);

  useEffect(() => {
    (async () => {
      const tokens = await listOwned(props.grpcClient, marketContractAddress, MARKETPLACE_CONTRACT_INFO, props.account);
      return Promise.all(
        tokens.map(async (t) => {
          return {
            ...t,
            cis2Contract: await CIS2Contract.create(props.grpcClient, t.contract),
          };
        }),
      );
    })().then(setTokens);
  }, [props.account, marketContractAddress]);

  if (tokens.length === 0) {
    return <></>;
  }

  return (
    <>
      <Typography variant="h6" component="h2">
        Owned Tokens
      </Typography>
      <ImageList key="nft-image-list" cols={3}>
        {tokens.map((t) => (
          <MarketplaceOwnedTokensListItem
            account={props.account}
            marketContractAddress={marketContractAddress}
            item={t}
            key={t.tokenId + t.contract.index + t.contract.subindex + t.owner}
            onSelected={(item) => props.onSelected(item)}
          />
        ))}
      </ImageList>
    </>
  );
}
