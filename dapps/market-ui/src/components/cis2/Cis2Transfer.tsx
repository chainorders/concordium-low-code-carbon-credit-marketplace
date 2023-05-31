import {
  cis0Supports,
  CIS0,
  ConcordiumGRPCClient,
  ContractAddress,
  CIS2,
  CIS2Contract,
  TransactionStatusEnum,
} from "@concordium/web-sdk";
import { Button, Container, MenuItem, Select, Stack, TextField } from "@mui/material";
import { FormEvent, useEffect, useState } from "react";
import { WalletApi, SchemaWithContext } from "@concordium/browser-wallet-api-helpers";
import { waitAndThrowError } from "../../models/ConcordiumContractClient";
import DisplayError from "../ui/DisplayError";
import TransactionProgress from "../ui/TransactionProgress";
import { CIS2_MULTI_CONTRACT_INFO, FRACTIONALIZER_CONTRACT_INFO } from "../../Constants";

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
  const [txn, setTxn] = useState<{ hash?: string; status?: TransactionStatusEnum }>({});
  const [contractName, setContractName] = useState<string>(CIS2_MULTI_CONTRACT_INFO.contractName);

  function setFormValue(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const address = { index: BigInt(form.index), subindex: BigInt(form.subindex) };
    const cis2Contract = new CIS2Contract(props.grpcClient, address, contractName);
    setState({ ...state, error: "", inProgress: true });
    props.grpcClient
      .getInstanceInfo(address)
      .then(() => cis0Supports(props.grpcClient, address, "CIS-2"))
      .then((supports) => validateSupportsCis2(supports))
      .then(() => transfer(cis2Contract))
      .then((txnHash) => waitAndThrowError(props.provider, txnHash, (status, hash) => setTxn({ hash, status })))
      .then(() => {
        setState({ ...state, error: "", inProgress: false });
        props.onDone(address, form.tokenId, form.quantity);
      })
      .catch((e: Error) => {
        console.error(e);
        setState({ ...state, inProgress: false, error: e.message });
      });
  }

  function onContractChange(fieldName: "index" | "subindex", value: string): void {
    setFormValue(fieldName, value);
  }

  useEffect(() => {
    if (!form.index || !form.subindex) {
      return;
    }

    setState({ ...state, error: "" });
    const address: ContractAddress = { index: BigInt(form.index), subindex: BigInt(form.subindex) };
    props.grpcClient
      .getInstanceInfo(address)
      .then((instanceInfo) => {
        const contractName = instanceInfo.name.replace("init_", "");

        switch (contractName) {
          case CIS2_MULTI_CONTRACT_INFO.contractName:
          case FRACTIONALIZER_CONTRACT_INFO.contractName:
            setContractName(contractName);
            setState({ ...state, error: "" });
            break;
          default:
            setState({ ...state, error: `Invalid Contract Name: ${contractName}` });
            setContractName("");
            break;
        }
      })
      .then(() => cis0Supports(props.grpcClient, address, "CIS-2"))
      .then((supports) => validateSupportsCis2(supports))
      .catch((e: Error) => {
        console.error(e);
        setState({ ...state, error: e.message });
        setContractName("");
      });
  }, [form.index, form.subindex]);

  return (
    <Stack component={"form"} onSubmit={submit} spacing={2}>
      <TextField
        id="contract-index"
        name="contractIndex"
        label="Contract Index"
        variant="standard"
        type={"number"}
        value={form.index.toString()}
        onChange={(e) => onContractChange("index", e.target.value)}
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
        onChange={(e) => onContractChange("subindex", e.target.value)}
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
      <Select
        label="Contract Name"
        variant="standard"
        value={contractName}
        onChange={(e) => setContractName(e.target.value as string)}
        disabled
        sx={{ textAlign: "left" }}
      >
        <MenuItem value={FRACTIONALIZER_CONTRACT_INFO.contractName}>
          Fractionalizer Contract ({FRACTIONALIZER_CONTRACT_INFO.contractName})
        </MenuItem>
        <MenuItem value={CIS2_MULTI_CONTRACT_INFO.contractName}>
          CIS2 Multi ({CIS2_MULTI_CONTRACT_INFO.contractName})
        </MenuItem>
      </Select>
      <DisplayError error={state.error} />
      <Container>
        <TransactionProgress hash={txn.hash} status={txn.status} inProgress={state.inProgress} />
      </Container>
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
