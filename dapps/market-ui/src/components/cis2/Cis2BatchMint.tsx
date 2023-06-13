import React, { useState } from 'react';

import { CIS2, ContractAddress, TransactionStatusEnum } from '@concordium/web-sdk';
import { Alert, AlertColor, Button, Grid, Stack, Typography } from '@mui/material';

import { mint } from '../../models/Cis2Client';
import { connectToWallet, ContractInfo } from '../../models/ConcordiumContractClient';
import { default as SnackbarAlert } from '../ui/Alert';
import TransactionProgress from '../ui/TransactionProgress';
import Cis2BatchItemMint from './Cis2BatchItemMint';

interface TokenState {
  tokenInfo: [CIS2.MetadataUrl, string];
  minting: boolean;
  minted: boolean;
  error: string;
}

function Cis2BatchMint(props: {
  contractInfo: ContractInfo;
  tokenContractAddress: ContractAddress;
  tokenMetadataMap: { [tokenId: string]: [CIS2.MetadataUrl, string] };
  onDone: (data: { [tokenId: string]: [CIS2.MetadataUrl, string] }) => void;
}) {
  const [alertState, setAlertState] = useState<{
    open: boolean;
    message: string;
    severity?: AlertColor;
  }>({ open: false, message: "" });

  const tokens: { [tokenId: string]: TokenState } = {};

  Object.keys(props.tokenMetadataMap).forEach(
    (tokenId) =>
      (tokens[tokenId] = {
        tokenInfo: props.tokenMetadataMap[tokenId],
        minting: false,
        minted: false,
        error: "",
      }),
  );

  const [state, setState] = useState({
    tokens,
    mintingCount: 0,
    minted: false,
  });
  const [txn, setTxn] = useState<{ hash: string; status: TransactionStatusEnum }>();

  function onMintClicked() {
    const tokens = state.tokens;
    const mintingCount = Object.keys(tokens).length;
    setTokensState(tokens, true, false);
    setState({
      ...state,
      tokens,
      mintingCount: state.mintingCount + mintingCount,
    });
    connectToWallet()
      .then((wallet) =>
        mint(
          wallet.provider,
          wallet.account,
          props.tokenMetadataMap,
          props.tokenContractAddress,
          props.contractInfo,
          BigInt(9999),
          (status, hash) => setTxn({ status, hash }),
        ),
      )
      .then(() => {
        setTokensState(tokens, false, true);
        const mintingCount = Object.keys(tokens).length;
        setState({
          ...state,
          tokens,
          mintingCount: state.mintingCount + mintingCount,
          minted: true,
        });
        setAlertState({ open: true, message: "Minted", severity: "success" });
        props.onDone(props.tokenMetadataMap);
      })
      .catch((e: Error) => {
        setTokensState(tokens, false, false, e.message);
        const mintingCount = Object.keys(tokens).length;
        setState({
          ...state,
          tokens,
          mintingCount: state.mintingCount - mintingCount,
          minted: false,
        });
        setAlertState({ open: true, message: "Error Minting", severity: "error" });
      });
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        <Typography variant="button" color={"InfoText"}>
          <>
            Contract : {props.tokenContractAddress.index.toString()}/{props.tokenContractAddress.subindex.toString()} (
            {props.contractInfo.contractName})
          </>
        </Typography>
      </Alert>
      <Grid container spacing={2}>
        {Object.keys(state.tokens).map((tokenId) => (
          <Grid item xs={4} key={tokenId}>
            <Cis2BatchItemMint
              contractInfo={props.contractInfo}
              error={state.tokens[tokenId].error}
              key={tokenId}
              tokenInfo={state.tokens[tokenId].tokenInfo}
              minted={state.tokens[tokenId].minted}
              minting={state.tokens[tokenId].minting}
              tokenId={tokenId}
            />
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" disabled={state.mintingCount > 0 || state.minted} onClick={() => onMintClicked()}>
        Mint
      </Button>
      {txn && <TransactionProgress hash={txn.hash} status={txn.status} />}
      <SnackbarAlert
        open={alertState.open}
        message={alertState.message}
        onClose={() => setAlertState({ open: false, message: "" })}
        severity={alertState.severity}
      />
    </Stack>
  );

  function setTokensState(
    tokens: { [tokenId: string]: TokenState },
    isMinting: boolean,
    isMinted: boolean,
    error?: string,
  ) {
    Object.keys(tokens).forEach((tokenId) => {
      tokens[tokenId].error = error || "";
      tokens[tokenId].minting = isMinting;

      if (isMinting) {
        tokens[tokenId].minted = false;
      } else {
        tokens[tokenId].minted = isMinted;
      }
    });
  }
}

export default Cis2BatchMint;
