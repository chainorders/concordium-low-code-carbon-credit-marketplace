import React from "react";

import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ConcordiumGRPCClient, ContractAddress } from "@concordium/web-sdk";
import { Container, Paper, Stack, Typography } from "@mui/material";

import ContractFindInstance from "../../components/ContractFindInstance";
import { ContractInfo } from "../../models/ConcordiumContractClient";
import FractionalizerContractInit from "../../components/cis2-fractionalizer/FractionalizerContractInit";

function FractionalizerFindOrInit(props: {
  grpcClient: ConcordiumGRPCClient;
  provider: WalletApi;
  account: string;
  contractInfo: ContractInfo;
  onDone: (address: ContractAddress) => void;
}) {
  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Paper sx={{ padding: "20px" }} variant="outlined">
        <Stack spacing={2}>
          <ContractFindInstance grpcClient={props.grpcClient} onDone={props.onDone} />
          <Typography variant="overline">Or</Typography>
          <FractionalizerContractInit {...props} />
        </Stack>
      </Paper>
    </Container>
  );
}

export default FractionalizerFindOrInit;
