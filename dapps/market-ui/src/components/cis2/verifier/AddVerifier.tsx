import { useState } from 'react';

import { TransactionStatusEnum } from '@concordium/web-sdk';
import { Button, Stack, TextField, Typography } from '@mui/material';

import { connectToWallet, ContractInfo } from '../../../models/ConcordiumContractClient';
import { addVerifier } from '../../../models/ProjectNFTClient';
import DisplayError from '../../ui/DisplayError';
import TransactionProgress from '../../ui/TransactionProgress';

export default function AddVerifier(props: { contractInfo: ContractInfo }) {
  const [form, setForm] = useState({
    index: "",
    subindex: "0",
    verifier: "",
  });
  const [state, setState] = useState({
    loading: false,
    error: "",
  });
  const [txn, setTxn] = useState<{
    status: TransactionStatusEnum;
    hash: string;
  }>();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.index || !form.subindex || !form.verifier) {
      setState({ ...state, error: "Please fill out all fields." });
    }

    setState({ ...state, loading: true });
    connectToWallet()
      .then((wallet) =>
        addVerifier(
          wallet.provider,
          wallet.account,
          { index: BigInt(form.index), subindex: BigInt(form.subindex) },
          props.contractInfo,
          form.verifier,
          BigInt(9999),
          (status, hash) => setTxn({ status, hash }),
        ),
      )
      .then(() => {
        setState({ ...state, loading: false, error: "" });
      })
      .catch((error) => {
        setState({ ...state, loading: false, error: error.message });
      });
  };

  return (
    <Stack spacing={2} mt={1} component="form" onSubmit={onSubmit}>
      <Typography variant="h4" component="h2" textAlign="left">
        Add Verifier
      </Typography>
      <TextField
        label="Contract Index"
        name="index"
        variant="standard"
        value={form.index}
        onChange={(event) => setForm({ ...form, index: event.target.value })}
      />
      <TextField
        label="Contract Subindex"
        name="subindex"
        variant="standard"
        value={form.subindex}
        onChange={(event) => setForm({ ...form, subindex: event.target.value })}
      />
      <TextField
        label="Verifier (Account Address)"
        variant="standard"
        value={form.verifier}
        onChange={(event) => setForm({ ...form, verifier: event.target.value })}
      />
      <DisplayError error={state.error} />
      {txn && <TransactionProgress status={txn.status} hash={txn.hash} />}
      <Button variant="contained" type="submit">
        Add Verifier
      </Button>
    </Stack>
  );
}
