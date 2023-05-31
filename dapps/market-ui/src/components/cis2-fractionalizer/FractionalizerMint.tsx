import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ContractAddress } from "@concordium/web-sdk";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import DisplayError from "../ui/DisplayError";
import { useState, FormEvent } from "react";
import { FRACTIONALIZER_CONTRACT_INFO } from "../../Constants";
import { mint } from "../../models/FractionalizerClient";

export default function FractionalizerMint(props: {
  collateralContractAddress: ContractAddress;
  collateralTokenId: string;
  provider: WalletApi;
  account: string;
  fracContractAddress: ContractAddress;
  onDone: (tokenId: string, quantity: string) => void;
}) {
  const [state, setState] = useState({
    error: "",
    inProgress: false,
  });
  const [form, setForm] = useState({
    tokenId: "01",
    quantity: "1",
    metadataUrl: "",
    metadataHash: "",
  });

  function setFormValue(key: string, value: string) {
    setForm({ ...form, [key]: value });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ ...state, inProgress: true });
    mint(
      props.provider,
      props.account,
      props.fracContractAddress,
      {
        owner: { Account: [props.account] },
        tokens: [
          [
            form.tokenId,
            {
              amount: form.quantity,
              contract: {
                index: Number(props.collateralContractAddress.index),
                subindex: Number(props.collateralContractAddress.subindex),
              },
              token_id: props.collateralTokenId,
              metadata: {
                url: form.metadataUrl,
                hash: form.metadataHash,
              },
            },
          ],
        ],
      },
      FRACTIONALIZER_CONTRACT_INFO,
    )
      .then(() => {
        setState({ ...state, inProgress: false });
        props.onDone(form.tokenId, form.quantity);
      })
      .catch((e: Error) => {
        console.error(e);
        setState({ ...state, inProgress: false, error: e.message });
      });
  }

  return (
    <Stack component={"form"} onSubmit={submit} spacing={2}>
      <Alert severity="info">
        <Typography variant="body2">
          You are about to Fractionalize {props.collateralTokenId} from{" "}
          {props.collateralContractAddress.index.toString()}/{props.collateralContractAddress.subindex.toString()}.
        </Typography>
      </Alert>
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
      <TextField
        id="metadata-url"
        name="metadataUrl"
        label="Metadata URL"
        variant="standard"
        type={"text"}
        disabled={state.inProgress}
        value={form.metadataUrl.toString()}
        onChange={(e) => setFormValue("metadataUrl", e.target.value)}
      />
      <TextField
        id="metadata-hash"
        name="metadataHash"
        label="Metadata Hash"
        variant="standard"
        type={"text"}
        disabled={state.inProgress}
        value={form.metadataHash.toString()}
        onChange={(e) => setFormValue("metadataHash", e.target.value)}
      />
      <DisplayError error={state.error} />
      <Typography variant="body2">{state.inProgress ? "In Progress" : ""}</Typography>
      <Button type="submit" variant="contained" disabled={state.inProgress}>
        Mint
      </Button>
    </Stack>
  );
}
