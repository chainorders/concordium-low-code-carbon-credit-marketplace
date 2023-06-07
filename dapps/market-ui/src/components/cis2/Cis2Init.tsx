import React, { FormEvent, useState } from 'react';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import { Button, Stack, Typography } from '@mui/material';

import {
    Cis2ContractInfo, connectToWallet, initContract
} from '../../models/ConcordiumContractClient';

function Cis2Init(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: Cis2ContractInfo;
  onDone: (address: ContractAddress, contractInfo: Cis2ContractInfo) => void;
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
        props.onDone(address, props.contractInfo);
      })
      .catch((err: Error) => {
        setState({ ...state, processing: false, error: err.message });
      });
  }

  return (
    <Stack component={"form"} spacing={2} onSubmit={submit}>
      {state.error && (
        <Typography component="div" color="error" variant="body1">
          {state.error}
        </Typography>
      )}
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

export default Cis2Init;
