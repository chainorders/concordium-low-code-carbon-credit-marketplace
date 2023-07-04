import { ContractAddress } from "@concordium/web-sdk";
import { Stack, TextField, Button, Grid, Card, CardContent, Typography, Tooltip } from "@mui/material";
import { useState } from "react";
import { Retire, projectNFTRetirementEvents } from "../../models/WebClient";
import DisplayError from "../ui/DisplayError";

export default function FractionalizerRetirements({
  defaultContractAddress,
}: {
  defaultContractAddress: ContractAddress;
}) {
  const [form, setForm] = useState({
    index: defaultContractAddress.index.toString(),
    subindex: defaultContractAddress.subindex.toString(),
    account: "",
  });
  const [state, setState] = useState({
    error: "",
    checking: false,
  });

  const [retirements, setRetirements] = useState<Retire[]>([]);

  function onFormSubmitted(): void {
    setState({ ...state, error: "", checking: true });
    projectNFTRetirementEvents(form.index, form.subindex, form.account)
      .then((res) => {
        console.log(res);
        setState({ ...state, checking: false, error: "" });
        setRetirements(res.map((e) => e.Retire[0]));
      })
      .catch((e: Error) => {
        setState({ ...state, checking: false, error: e.message });
      });
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={2} direction={"row"}>
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
        <Button variant="contained" type="button" onClick={() => onFormSubmitted()}>
          Get
        </Button>
      </Stack>
      <DisplayError error={state.error} />
      <Grid container spacing={2}>
        {retirements.map((retirement) => (
          <Grid item xs={3} key={retirement.token_id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div">
                  Token ID: {retirement.token_id}
                </Typography>
                <Tooltip title={retirement.owner.Account[0]}>
                  <Typography variant="caption" component="div">
                    Owner: {retirement.owner.Account[0].substring(0, 6)}...
                  </Typography>
                </Tooltip>
                <Typography variant="caption" component="div">
                  Amount: {retirement.amount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
