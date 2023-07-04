import React, { useState } from "react";

import {
  CIS2Contract,
  ConcordiumGRPCClient,
  ContractAddress,
  InvokeContractFailedResult,
  RejectReasonTag,
} from "@concordium/web-sdk";
import { Button, ButtonGroup, Stack, TextField, Typography } from "@mui/material";
import DisplayError from "../ui/DisplayError";

function Cis2BalanceOf(props: {
  grpcClient: ConcordiumGRPCClient;
  contractName: string;
  defaultContractAddress?: ContractAddress;
  defaultAccount?: string;
}) {
  const [form, setForm] = useState({
    tokenId: "",
    index: props.defaultContractAddress?.index.toString() || "",
    subindex: props.defaultContractAddress?.subindex.toString() || "",
    account: props.defaultAccount || "",
    contractName: props.contractName,
  });

  const [balance, setBalance] = useState("");

  const [state, setState] = useState({
    checking: false,
    error: "",
  });

  function checkBalance() {
    setState({ ...state, checking: true, error: "" });
    setBalance("");

    if (!form.index || !form.subindex || !form.account || !form.tokenId) {
      setState({ ...state, checking: false, error: "Please fill out all fields" });
      return;
    }

    const cis2Contract = new CIS2Contract(
      props.grpcClient,
      {
        index: BigInt(form.index),
        subindex: BigInt(form.subindex),
      },
      form.contractName,
    );

    cis2Contract
      .balanceOf({ tokenId: form.tokenId, address: form.account })
      .then((balance) => {
        setState({ ...state, checking: false, error: "" });
        setBalance(balance.toString());
      })
      .catch((err: Error) => {
        if (err.cause) {
          const cause = err.cause as InvokeContractFailedResult;
          if (cause.reason.tag === RejectReasonTag.RejectedReceive) {
            switch (cause.reason.rejectReason) {
              case -42000001:
                setState({
                  ...state,
                  checking: false,
                  error: "Token not found",
                });
                return;
              case -42000002:
                setState({
                  ...state,
                  checking: false,
                  error: "Insufficient Funds",
                });
                return;
              case -42000003:
                setState({ ...state, checking: false, error: "Unauthorized" });
                return;
            }
          }
        }
        setState({ ...state, checking: false, error: err.message });
      });
  }

  function onOkClicked() {
    checkBalance();
  }

  return (
    <Stack component={"form"} spacing={2}>
      <TextField
        id="contract-index"
        name="contractIndex"
        label="Contract Index"
        variant="standard"
        type={"number"}
        disabled={state.checking}
        value={form.index}
        onChange={(e) => setForm({ ...form, index: e.target.value })}
      />
      <TextField
        id="contract-subindex"
        name="contractSubindex"
        label="Contract Sub Index"
        variant="standard"
        type={"number"}
        disabled={state.checking}
        value={form.subindex}
        onChange={(e) => setForm({ ...form, subindex: e.target.value })}
      />
      <TextField
        id="account"
        name="account"
        label="Account"
        variant="standard"
        type={"string"}
        disabled={state.checking}
        value={form.account}
        onChange={(e) => setForm({ ...form, account: e.target.value })}
      />
      <TextField
        id="token-id"
        label="Token Id"
        variant="standard"
        value={form.tokenId}
        onChange={(v) => setForm({ ...form, tokenId: v.target.value })}
        disabled={state.checking}
      />
      {balance && (
        <Typography component="div" variant="body1">
          Balance: {balance.toString()}
        </Typography>
      )}
      <DisplayError error={state.error} />
      {state.checking && <Typography component="div">Checking..</Typography>}
      <ButtonGroup fullWidth size="large" disabled={state.checking}>
        <Button variant="contained" onClick={() => onOkClicked()}>
          Ok
        </Button>
      </ButtonGroup>
    </Stack>
  );
}

export default Cis2BalanceOf;
