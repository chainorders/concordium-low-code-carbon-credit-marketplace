import React, { useEffect, useState } from "react";

import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { CIS2Contract, ConcordiumGRPCClient } from "@concordium/web-sdk";
import ImageList from "@mui/material/ImageList";

import { MARKET_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_INFO } from "../Constants";
import { list, TokenListItem } from "../models/MarketplaceClient";
import MarketplaceTokensListItem from "./MarketplaceTokensListItem";
import MarketplaceTransferDialog from "./MarketplaceTransferDialog";
import MarketplaceReturnDialog from "./MarketplaceReturnDialog";
import { useParamsContractAddress } from "./utils";
import { AlertColor } from "@mui/material";
import Alert from "./ui/Alert";

type ListItem = TokenListItem & { cis2Contract: CIS2Contract };

/**
 * Gets the List of buyable tokens from Marketplace contract and displays them.
 */
function MarketplaceTokensList(props: { grpcClient: ConcordiumGRPCClient; provider: WalletApi; account: string }) {
  const [selectedToken, setSelectedToken] = useState<ListItem>();
  const [returnToken, setReturnToken] = useState<ListItem>();
  const [tokens, setTokens] = useState<Array<ListItem>>([]);
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const [alertState, setAlertState] = useState({
    open: false,
    message: "",
    severity: "success" as AlertColor,
  });
  useEffect(() => {
    (async () => {
      const tokens = await list(props.grpcClient, props.account, marketContractAddress, MARKETPLACE_CONTRACT_INFO);
      return Promise.all(
        tokens.map(async (t) => {
          return {
            ...t,
            cis2Contract: await CIS2Contract.create(props.grpcClient, t.contract),
          };
        }),
      );
    })().then(setTokens);
  }, [props.account, selectedToken, returnToken, marketContractAddress]);

  function handleReturnClose(res: "success" | "cancel") {
    if (res === "success") {
      setAlertState({
        open: true,
        message: "Token returned successfully",
        severity: "success",
      });
    } else if (res === "cancel") {
      setAlertState({
        open: true,
        message: "Token return cancelled",
        severity: "info",
      });
    }

    setReturnToken(undefined);
  }

  return (
    <>
      <ImageList key="nft-image-list" cols={3}>
        {tokens.map((t) => (
          <MarketplaceTokensListItem
            account={props.account}
            marketContractAddress={marketContractAddress}
            item={t}
            key={t.tokenId + t.contract.index + t.contract.subindex + t.owner}
            onBuyClicked={setSelectedToken}
            onReturnClicked={setReturnToken}
          />
        ))}
      </ImageList>
      {selectedToken && (
        <MarketplaceTransferDialog
          provider={props.provider}
          account={props.account}
          marketContractAddress={marketContractAddress}
          isOpen={!!selectedToken}
          token={selectedToken}
          onClose={() => setSelectedToken(undefined)}
        />
      )}
      {returnToken && (
        <MarketplaceReturnDialog
          provider={props.provider}
          account={props.account}
          marketContractAddress={marketContractAddress}
          isOpen={!!returnToken}
          token={returnToken}
          onClose={(res) => handleReturnClose(res)}
        />
      )}
      <Alert
        open={alertState.open}
        severity={alertState.severity}
        onClose={() => setAlertState({ ...alertState, open: false })}
        message={alertState.message}
      ></Alert>
    </>
  );
}

export default MarketplaceTokensList;
