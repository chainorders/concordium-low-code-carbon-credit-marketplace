import React, { FormEvent, useState } from 'react';

import { ContractAddress } from '@concordium/web-sdk';
import { Button, Stack, Typography } from '@mui/material';

import { connectToWallet, ContractInfo, initContract } from '../../models/ConcordiumContractClient';
import DisplayError from '../ui/DisplayError';

export default function FractionalizerContractInit(props: {
  contractInfo: ContractInfo;
  onDone: (address: ContractAddress) => void;
}) {
  const [state, setState] = useState({
    error: "",
    processing: false,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ ...state, processing: true });

    connectToWallet()
      .then((wallet) => initContract(wallet.provider, props.contractInfo, wallet.account))
      .then((address) => {
        setState({ ...state, processing: false });
        props.onDone(address);
      })
      .catch((err: Error) => {
        setState({ ...state, processing: false, error: err.message });
      });
  }

  return (
    <Stack component={"form"} spacing={2} onSubmit={submit}>
      <DisplayError error={state.error} />
      {state.processing && (
        <Typography component="div" variant="body1">
          Deploying..
        </Typography>
      )}
      <Button variant="contained" disabled={state.processing} type="submit">
        Deploy New
      </Button>
    </Stack>
  );
}
