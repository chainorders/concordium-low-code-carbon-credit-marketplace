import { ConcordiumGRPCClient, ContractAddress, TransactionStatusEnum } from "@concordium/web-sdk";
import { ContractInfo, connectToWallet } from "../../models/ConcordiumContractClient";
import { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import DisplayError from "../ui/DisplayError";
import TransactionProgress from "../ui/TransactionProgress";
import { retire } from "../../models/ProjectFractionalizerClient";

export function FractionalizerRetire(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  address: ContractAddress;
  onDone: (output: { tokenIds: string[] }) => void;
}) {
  const [form, setForm] = useState({
    tokenId: "",
    amount: "1",
  });
  const [txn, setTxn] = useState<{ hash: string; status: TransactionStatusEnum }>();

  const [state, setState] = useState({
    isProcessing: false,
    error: "",
  });

  const onsubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({
      ...state,
      isProcessing: true,
      error: "",
    });
    setTxn(undefined);

    const amountInt = parseInt(form.amount);
    if (isNaN(amountInt)) {
      setState({ ...state, isProcessing: false, error: "Amount must be a number" });
      return;
    }

    connectToWallet()
      .then((wallet) =>
        retire(
          wallet.provider,
          props.grpcClient,
          props.address,
          props.contractInfo,
          wallet.account,
          form.tokenId,
          form.amount,
          (status, hash) => setTxn({ status, hash }),
        ),
      )
      .then(() => {
        setState({ ...state, isProcessing: false });
        props.onDone({ tokenIds: [form.tokenId] });
      })
      .catch((e: Error) => {
        console.error(e);
        setState({ ...state, isProcessing: false, error: e.message });
      });
  };

  return (
    <>
      <Stack spacing={2} component={"form"} onSubmit={onsubmit}>
        <TextField
          label="Token ID"
          name="tokenId"
          variant="outlined"
          fullWidth
          onChange={(e) => setForm({ ...form, tokenId: e.target.value })}
          value={form.tokenId}
        />
        <TextField
          label="Quantity"
          name="amount"
          variant="outlined"
          fullWidth
          type="number"
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          value={form.amount}
        />
        <DisplayError error={state.error} />
        <Button type="submit" variant="contained" color="primary">
          Retire
        </Button>
        {txn && <TransactionProgress hash={txn.hash} status={txn.status} />}
      </Stack>
    </>
  );
}
