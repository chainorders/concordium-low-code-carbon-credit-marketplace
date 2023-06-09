import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/common-sdk';
import { CIS2Contract } from '@concordium/web-sdk';
import { Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';

import Cis2Transfer from '../../components/cis2/Cis2Transfer';
import MarketplaceAdd from '../../components/MarketplaceAdd';
import { useParamsContractAddress } from '../../components/utils';
import { MARKET_CONTRACT_ADDRESS } from '../../Constants';
import { Cis2ContractInfo } from '../../models/ConcordiumContractClient';

enum Steps {
  TransferToken,
  AddToken,
}
type StepType = { step: Steps; title: string };

function SellPage(props: { grpcClient: ConcordiumGRPCClient; contractInfo: Cis2ContractInfo }) {
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const steps = [
    {
      title: "Transfer Token",
      step: Steps.TransferToken,
    },
    { title: "Add Token", step: Steps.AddToken },
  ];

  const [state, setState] = useState<{
    activeStep: StepType;
    nftContract?: ContractAddress;
    cis2Contract?: CIS2Contract;
    tokenId?: string;
    quantity?: string;
  }>({
    activeStep: steps[0],
  });

  async function onTransferred(address: ContractAddress, tokenId: string, quantity: string) {
    setState({
      ...state,
      activeStep: steps[1],
      nftContract: address,
      cis2Contract: await CIS2Contract.create(props.grpcClient, address),
      tokenId,
      quantity,
    });
  }

  const navigate = useNavigate();
  function onTokenListed() {
    navigate("/");
  }

  function StepContent() {
    switch (state.activeStep.step) {
      case Steps.TransferToken:
        return (
          <>
            <Cis2Transfer
              grpcClient={props.grpcClient}
              to={{
                address: marketContractAddress,
                hookName: "recieve_cis2",
              }}
              onDone={(address, tokenId, quantity) => onTransferred(address, tokenId, quantity)}
            />
          </>
        );
      case Steps.AddToken:
        return (
          <MarketplaceAdd
            grpcClient={props.grpcClient}
            marketContractAddress={marketContractAddress}
            nftContractAddress={state.nftContract!}
            tokenId={state.tokenId!}
            cis2Contract={state.cis2Contract!}
            onDone={() => onTokenListed()}
          />
        );
      default:
        return <>Invalid Step</>;
    }
  }

  return (
    <>
      <Stepper activeStep={state.activeStep.step} alternativeLabel sx={{ padding: "20px" }}>
        {steps.map((step) => (
          <Step key={step.step}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Paper sx={{ padding: "20px" }} variant="outlined">
        <Typography variant="h4" gutterBottom sx={{ pt: "20px" }} textAlign="left">
          {state.activeStep.title}
        </Typography>
        <StepContent />
      </Paper>
    </>
  );
}

export default SellPage;
