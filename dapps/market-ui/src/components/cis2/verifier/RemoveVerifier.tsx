import { useState } from 'react';

import { TransactionStatusEnum } from '@concordium/web-sdk';
import { AlertColor, Button, Stack, TextField, Typography } from '@mui/material';

import { connectToWallet, ContractInfo } from '../../../models/ConcordiumContractClient';
import { removeVerifier } from '../../../models/ProjectNFTClient';
import Alert from '../../ui/Alert';
import DisplayError from '../../ui/DisplayError';
import TransactionProgress from '../../ui/TransactionProgress';

export default function RemoveVerifier(props: { contractInfo: ContractInfo }) {
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
  const [alert, setAlert] = useState({
    open: false,
    severity: "success" as AlertColor,
    message: "",
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.index || !form.subindex || !form.verifier) {
      setState({ ...state, error: "Please fill out all fields." });
    }

    setState({ ...state, loading: true });
    connectToWallet()
      .then((wallet) =>
        removeVerifier(
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
        setAlert({
          open: true,
          severity: "success",
          message: "Verifier removed successfully.",
        });
      })
      .catch((error) => {
        setState({ ...state, loading: false, error: error.message });
      });
  };

  return (
    <Stack spacing={2} mt={1} component="form" onSubmit={onSubmit}>
      <Typography variant="h4" component="h2" textAlign="left">
        Remove Verifier
      </Typography>
      <TextField
        label="Contract Index"
        variant="standard"
        name="index"
        value={form.index}
        onChange={(event) => setForm({ ...form, index: event.target.value })}
      />
      <TextField
        label="Contract Subindex"
        variant="standard"
        name="subindex"
        value={form.subindex}
        onChange={(event) => setForm({ ...form, subindex: event.target.value })}
      />
      <TextField
        label="Verifier (Account Address)"
        variant="standard"
        name="verifier"
        value={form.verifier}
        onChange={(event) => setForm({ ...form, verifier: event.target.value })}
      />
      <DisplayError error={state.error} />
      {txn && <TransactionProgress status={txn.status} hash={txn.hash} />}
      {alert.open && (
        <Alert
          severity={alert.severity}
          message={alert.message}
          onClose={() => setAlert({ ...alert, open: false })}
        ></Alert>
      )}
      <Button variant="contained" type="submit">
        Remove Verifier
      </Button>
    </Stack>
  );
}
