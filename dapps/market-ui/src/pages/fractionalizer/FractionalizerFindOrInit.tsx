import React from 'react';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import { Container, Paper, Stack, Typography } from '@mui/material';

import FractionalizerContractInit from '../../components/cis2-fractionalizer/FractionalizerContractInit';
import ContractFindInstance from '../../components/ContractFindInstance';
import { ContractInfo } from '../../models/ConcordiumContractClient';

function FractionalizerFindOrInit(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  defaultContractAddress: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Paper sx={{ padding: "20px" }} variant="outlined">
        <Stack spacing={2}>
          <ContractFindInstance
            grpcClient={props.grpcClient}
            onDone={props.onDone}
            defaultContractAddress={props.defaultContractAddress}
          />
          <Typography variant="overline">Or</Typography>
          <FractionalizerContractInit {...props} />
        </Stack>
      </Paper>
    </Container>
  );
}

export default FractionalizerFindOrInit;
