import React, { useState } from "react";

import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import { ConcordiumGRPCClient, ContractAddress } from "@concordium/common-sdk";
import { Paper, Step, StepLabel, Stepper, Typography } from "@mui/material";

import { Cis2ContractInfo } from "../../models/ConcordiumContractClient";
import Cis2Transfer from "../cis2/Cis2Transfer";
import FractionalizerMint from "./FractionalizerMint";

enum Steps {
  TransferToken,
  FractionalizeToken,
}
type StepType = { step: Steps; title: string };

function FractionalizeToken(props: {
  grpcClient: ConcordiumGRPCClient;
  provider: WalletApi;
  account: string;
  fracContractAddress: ContractAddress;
  contractInfo: Cis2ContractInfo;
}) {
  const steps = [
    {
      title: "Transfer Token",
      step: Steps.TransferToken,
    },
    { title: "Fractionalize Token", step: Steps.FractionalizeToken },
  ];

  const [state, setState] = useState<{
    activeStep: StepType;
    collateralContractAddress?: ContractAddress;
    collateralTokenId?: string;
    quantity?: string;
  }>({
    activeStep: steps[0],
  });

  async function onTransferred(address: ContractAddress, tokenId: string, quantity: string) {
    setState({
      ...state,
      activeStep: steps[1],
      collateralContractAddress: address,
      collateralTokenId: tokenId,
      quantity,
    });
  }

  async function onTokenFractionalized(tokenId: string, quantity: string) {
    alert(`Token ${tokenId} fractionalized with quantity ${quantity}`);
  }

  function StepContent() {
    switch (state.activeStep.step) {
      case Steps.TransferToken:
        return (
          <Cis2Transfer
            grpcClient={props.grpcClient}
            provider={props.provider}
            account={props.account}
            to={{
              address: props.fracContractAddress,
              hookName: "onReceivingCIS2",
            }}
            onDone={(address, tokenId, quantity) => onTransferred(address, tokenId, quantity)}
          />
        );
      case Steps.FractionalizeToken:
        return (
          <FractionalizerMint
            collateralContractAddress={state.collateralContractAddress!}
            collateralTokenId={state.collateralTokenId!}
            provider={props.provider}
            account={props.account}
            fracContractAddress={props.fracContractAddress}
            onDone={(tokenId, quantity) => onTokenFractionalized(tokenId, quantity)}
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

export default FractionalizeToken;
