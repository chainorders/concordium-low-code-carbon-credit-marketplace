import React, { FormEvent, useState } from "react";

import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Button, Stack, Typography } from "@mui/material";

import { ContractInfo, initContract } from "../../models/ConcordiumContractClient";
import DisplayError from "../ui/DisplayError";

export default function FractionalizerContractInit(props: {
  provider: WalletApi;
  account: string;
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

    initContract(props.provider, props.contractInfo, props.account)
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
