import React, { useEffect, useState } from 'react';

import { CIS2Contract, ConcordiumGRPCClient } from '@concordium/web-sdk';
import { AlertColor, Grid } from '@mui/material';

import { MARKET_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_INFO } from '../Constants';
import { list, TokenListItem } from '../models/MarketplaceClient';
import { User } from '../types/user';
import MarketplaceReturnDialog from './MarketplaceReturnDialog';
import MarketplaceTokensListItem from './MarketplaceTokensListItem';
import MarketplaceTransferDialog from './MarketplaceTransferDialog';
import Alert from './ui/Alert';
import { useParamsContractAddress } from './utils';

type ListItem = TokenListItem & { cis2Contract: CIS2Contract };

/**
 * Gets the List of buyable tokens from Marketplace contract and displays them.
 */
function MarketplaceTokensList(props: { grpcClient: ConcordiumGRPCClient, user: User }) {
  const { grpcClient, user } = props;
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
      const tokens = await list(grpcClient, marketContractAddress, MARKETPLACE_CONTRACT_INFO);
      return Promise.all(
        tokens.map(async (t) => {
          return {
            ...t,
            cis2Contract: await CIS2Contract.create(grpcClient, t.contract),
          };
        }),
      );
    })().then(setTokens);
  }, [selectedToken, returnToken]);

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
      <Grid key="nft-image-list" container spacing={1}>
        {tokens.map((t) => (
          <MarketplaceTokensListItem
            marketContractAddress={marketContractAddress}
            item={t}
            key={t.tokenId + t.contract.index + t.contract.subindex + t.owner}
            onBuyClicked={setSelectedToken}
            onReturnClicked={setReturnToken}
            user={user}
          />
        ))}
      </Grid>
      {selectedToken && (
        <MarketplaceTransferDialog
          marketContractAddress={marketContractAddress}
          isOpen={!!selectedToken}
          token={selectedToken}
          onClose={() => setSelectedToken(undefined)}
          user={user}
        />
      )}
      {returnToken && (
        <MarketplaceReturnDialog
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
