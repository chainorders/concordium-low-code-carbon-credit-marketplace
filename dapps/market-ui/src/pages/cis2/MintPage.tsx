import React, { useState } from 'react';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import { ArrowBackRounded } from '@mui/icons-material';
import { Grid, IconButton, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Container } from '@mui/system';

import Cis2BatchMetadataPrepareOrAdd from '../../components/cis2/Cis2BatchMetadataPrepareOrAdd';
import Cis2BatchMint from '../../components/cis2/Cis2BatchMint';
import Cis2TokensDisplay from '../../components/cis2/Cis2TokensDisplay';
import ConnectPinata from '../../components/ConnectPinata';
import UploadFiles from '../../components/ui/UploadFiles';
import { ContractInfo } from '../../models/ConcordiumContractClient';
import { TokenInfo } from '../../models/ProjectNFTClient';
import {
    Cis2MintEvent, Cis2TokenMetadataEvent, ModuleEvent, ProjectNftEvent, ProjectNftMaturityTimeEvent
} from '../../models/web/Events';

enum Steps {
  ConnectPinata,
  UploadFiles,
  PrepareMetadata,
  Mint,
  Minted,
}

type StepType = { step: Steps; title: string };
type MintMethodEvents = {
  mint: Cis2MintEvent;
  tokenMetadata: Cis2TokenMetadataEvent;
  maturityTime: ProjectNftMaturityTimeEvent;
};

function MintPage(props: { grpcClient: ConcordiumGRPCClient; contractInfo: ContractInfo, tokenContract: ContractAddress }) {
  const { tokenContract } = props;
  const steps: StepType[] = [
    {
      step: Steps.ConnectPinata,
      title: "Connect Pinata",
    },
    {
      step: Steps.UploadFiles,
      title: "Upload Image Files",
    },
    {
      step: Steps.PrepareMetadata,
      title: "Prepare Metadata",
    },
    { step: Steps.Mint, title: "Mint" },
    { step: Steps.Minted, title: "Minted" },
  ];

  const [state, setState] = useState<{
    activeStep: StepType;
    tokens: TokenInfo[];
    pinataJwt: string;
    files: File[];
  }>({
    activeStep: steps[0],
    pinataJwt: "",
    files: [],
    tokens: [],
  });

  const [mintedTokens, setMintedTokens] = useState<MintMethodEvents[]>([]);

  function onPinataConnected(pinataJwt: string) {
    setState({
      ...state,
      pinataJwt,
      activeStep: steps[2],
    });
  }

  function onPinataSkipped() {
    setState({
      ...state,
      pinataJwt: "",
      activeStep: steps[3],
    });
  }

  function onFilesUploaded(files: File[]) {
    setState({
      ...state,
      files,
      activeStep: steps[3],
    });
  }

  function onMetadataPrepared(tokens: TokenInfo[]) {
    console.log("MintPage: onMetadataPrepared", tokens);
    setState({
      ...state,
      activeStep: steps[4],
      tokens,
    });
  }

  function onTokensMinted(mintedEvents: ModuleEvent[]) {
    const mintedTokens: { [tokenId: string]: MintMethodEvents } = {};
    (mintedEvents as ProjectNftEvent[]).forEach((event) => {
      if (event.Mint) {
        const token = mintedTokens[event.Mint.token_id] || {};
        token.mint = event.Mint;
        mintedTokens[event.Mint.token_id] = token;
      } else if (event.TokenMetadata) {
        const token = mintedTokens[event.TokenMetadata.token_id] || {};
        token.tokenMetadata = event.TokenMetadata;
        mintedTokens[event.TokenMetadata.token_id] = token;
      } else if (event.MaturityTime) {
        const token = mintedTokens[event.MaturityTime.token_id] || {};
        token.maturityTime = event.MaturityTime;
        mintedTokens[event.MaturityTime.token_id] = token;
      }
    });

    setMintedTokens(Object.values(mintedTokens));
    setState({
      ...state,
      activeStep: steps[5],
    });
  }

  function StepContent() {
    switch (state.activeStep.step) {
      case Steps.ConnectPinata:
        return <ConnectPinata onDone={onPinataConnected} onSkip={onPinataSkipped} jwt={state.pinataJwt} />;
      case Steps.UploadFiles:
        return <UploadFiles onDone={onFilesUploaded} files={state.files} />;
      case Steps.PrepareMetadata:
        return (
          <Cis2BatchMetadataPrepareOrAdd
            contractInfo={props.contractInfo}
            pinataJwt={state.pinataJwt}
            files={state.files}
            onDone={onMetadataPrepared}
          />
        );
      case Steps.Mint:
        return (
          <Cis2BatchMint
            contractInfo={props.contractInfo}
            tokenContractAddress={tokenContract!}
            tokenMetadataMap={state.tokens}
            onDone={onTokensMinted}
          />
        );
      case Steps.Minted:
        return <Cis2TokensDisplay tokens={mintedTokens} />;
      default:
        return <>Invalid Step</>;
    }
  }

  function goBack(): void {
    const activeStepIndex = steps.findIndex((s) => s.step === state.activeStep.step);
    const previousStepIndex = Math.max(activeStepIndex - 1, 0);

    setState({ ...state, activeStep: steps[previousStepIndex] });
  }

  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Stepper activeStep={state.activeStep.step} alternativeLabel sx={{ padding: "20px" }}>
        {steps.map((step) => (
          <Step key={step.step}>
            <StepLabel>{step.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Paper sx={{ padding: "20px" }} variant="outlined">
        <Grid container>
          <Grid item xs={1}>
            <IconButton sx={{ border: "1px solid black", borderRadius: "100px" }} onClick={() => goBack()}>
              <ArrowBackRounded></ArrowBackRounded>
            </IconButton>
          </Grid>
          <Grid item xs={11}>
            <Typography variant="h4" gutterBottom sx={{ pt: "20px", width: "100%" }} textAlign="center">
              {state.activeStep.title}
            </Typography>
          </Grid>
        </Grid>
        <StepContent />
      </Paper>
    </Container>
  );
}

export default MintPage;
