import { cis0Supports, CIS0, ConcordiumGRPCClient, ContractAddress, CIS2, CIS2Contract } from "@concordium/web-sdk";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { FormEvent, useState } from "react";
import { CIS2_MULTI_CONTRACT_INFO } from "../../Constants";
import { WalletApi, SchemaWithContext } from "@concordium/browser-wallet-api-helpers";
import { waitAndThrowError } from "../../models/ConcordiumContractClient";
import DisplayError from "../ui/DisplayError";

export default function Cis2Transfer(props: {
  onDone: (address: ContractAddress, tokenId: string, quantity: string) => void;
  grpcClient: ConcordiumGRPCClient;
  account: string;
  to: CIS2.Receiver;
  provider: WalletApi;
}) {
  const [state, setState] = useState({
    error: "",
    inProgress: false,
  });
  const [form, setForm] = useState({
    index: "",
    subindex: "0",
    tokenId: "01",
    quantity: "1",
  });

  function setFormValue(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const address = { index: BigInt(form.index), subindex: BigInt(form.subindex) };
    const cis2Contract = new CIS2Contract(props.grpcClient, address, CIS2_MULTI_CONTRACT_INFO.contractName);
    setState({ ...state, error: "", inProgress: true });
    props.grpcClient
      .getInstanceInfo(address)
      .then(() => cis0Supports(props.grpcClient, address, "CIS-2"))
      .then((supports) => validateSupportsCis2(supports))
      .then(() => transfer(cis2Contract))
      .then((txnHash) => waitAndThrowError(props.provider, txnHash))
      .then(() => {
        setState({ ...state, error: "", inProgress: false });
        props.onDone(address, form.tokenId, form.quantity);
      })
      .catch((e: Error) => {
        setState({ ...state, inProgress: false, error: e.message });
      });
  }

  return (
    <Stack component={"form"} onSubmit={submit} spacing={2}>
      <TextField
        id="contract-index"
        name="contractIndex"
        label="Contract Index"
        variant="standard"
        type={"number"}
        value={form.index.toString()}
        onChange={(e) => setFormValue("index", e.target.value)}
        disabled={state.inProgress}
      />
      <TextField
        id="contract-subindex"
        name="contractSubindex"
        label="Contract Sub Index"
        variant="standard"
        type={"number"}
        disabled={state.inProgress}
        value={form.subindex.toString()}
        onChange={(e) => setFormValue("subindex", e.target.value)}
      />
      <TextField
        id="token-id"
        name="tokenId"
        label="Token Id"
        variant="standard"
        type={"text"}
        disabled={state.inProgress}
        value={form.tokenId.toString()}
        onChange={(e) => setFormValue("tokenId", e.target.value)}
      />
      <TextField
        id="quantity"
        name="quantity"
        label="Token Quantity"
        variant="standard"
        type={"number"}
        disabled={state.inProgress}
        value={form.quantity.toString()}
        onChange={(e) => setFormValue("quantity", e.target.value)}
      />
      <DisplayError error={state.error} />
      <Typography variant="body2">{state.inProgress ? "In Progress" : ""}</Typography>
      <Button type="submit" variant="contained" disabled={state.inProgress}>
        Transfer
      </Button>
    </Stack>
  );

  function validateSupportsCis2(supports: CIS0.SupportResult | undefined) {
    if (!supports) {
      throw new Error("Could not check if contract supports CIS-2");
    }

    switch (supports?.type) {
      case CIS0.SupportType.SupportBy:
      case CIS0.SupportType.NoSupport:
        throw new Error("Contract does not support CIS-2");
    }
  }

  function transfer(cis2Contract: CIS2Contract) {
    const transfer = {
      from: props.account,
      to: props.to,
      tokenAmount: BigInt(form.quantity),
      tokenId: form.tokenId,
    } as CIS2.Transfer;
    const {
      type,
      payload,
      parameter: { json },
      schema,
    } = cis2Contract.createTransfer({ energy: BigInt(10000) }, transfer);

    return props.provider.sendTransaction(props.account, type, payload, json, schema as SchemaWithContext);
  }
}
