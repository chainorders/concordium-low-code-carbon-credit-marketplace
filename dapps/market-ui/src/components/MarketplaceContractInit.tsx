import React, { FormEvent, useState } from 'react';

import { ContractAddress } from '@concordium/web-sdk';
import { Button, Stack, TextField, Typography } from '@mui/material';

import { connectToWallet, ContractInfo, initContract } from '../models/ConcordiumContractClient';

function MarketplaceContractInit(props: { contractInfo: ContractInfo; onDone: (address: ContractAddress) => void }) {
  const [state, setState] = useState({
    error: "",
    processing: false,
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const commission = parseInt(formData.get("commission")?.toString() || "0");
    setState({ ...state, processing: true, error: "" });

    const params = { commission: commission * 100 };
    connectToWallet()
      .then((wallet) => initContract(wallet.provider, props.contractInfo, wallet.account, params))
      .then((address) => {
        setState({ ...state, processing: false });
        props.onDone(address);
      })
      .catch((err: Error) => {
        console.error(err);
        setState({ ...state, processing: false, error: err.message });
      });
  }

  return (
    <Stack component={"form"} spacing={2} onSubmit={submit}>
      <TextField
        name="commission"
        id="commission"
        type="number"
        label="Commission %"
        variant="standard"
        fullWidth
        disabled={state.processing}
        required
        defaultValue={0}
      />
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

export default MarketplaceContractInit;
