import React, { useState } from 'react';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import { ArrowBackRounded } from '@mui/icons-material';
import { Grid, IconButton, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Container } from '@mui/system';

import Cis2BatchMetadataPrepareOrAdd from '../../components/cis2/Cis2BatchMetadataPrepareOrAdd';
import Cis2BatchMint from '../../components/cis2/Cis2BatchMint';
import Cis2FindInstanceOrInit from '../../components/cis2/Cis2FindInstanceOrInit';
import Cis2TokensDisplay from '../../components/cis2/Cis2TokensDisplay';
import ConnectPinata from '../../components/ConnectPinata';
import UploadFiles from '../../components/ui/UploadFiles';
import { Cis2ContractInfo } from '../../models/ConcordiumContractClient';
import { TokenInfo } from '../../models/ProjectNFTClient';
import {
    ProjectNftEvent, ProjectNftMaturityTimeEvent, ProjectNftMintEvent, ProjectNftTokenMetadataEvent
} from '../../models/web/Events';

enum Steps {
  GetOrInitCis2,
  ConnectPinata,
  UploadFiles,
  PrepareMetadata,
  Mint,
  Minted,
}

type StepType = { step: Steps; title: string };
type MintMethodEvents = {
  mint: ProjectNftMintEvent;
  tokenMetadata: ProjectNftTokenMetadataEvent;
  maturityTime: ProjectNftMaturityTimeEvent;
};

function MintPage(props: { grpcClient: ConcordiumGRPCClient; contractInfo: Cis2ContractInfo }) {
  const steps: StepType[] = [
    {
      step: Steps.GetOrInitCis2,
      title: "Create New or Find Existing NFT Collection",
    },
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
    nftContract?: ContractAddress;
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

  function onGetCollectionAddress(address: ContractAddress) {
    setState({
      ...state,
      activeStep: steps[1],
      nftContract: address,
    });
  }

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

  function onTokensMinted(mintedEvents: ProjectNftEvent[]) {
    const mintedTokens: { [tokenId: string]: MintMethodEvents } = {};
    mintedEvents.forEach((event) => {
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
      case Steps.GetOrInitCis2:
        return (
          <Cis2FindInstanceOrInit
            grpcClient={props.grpcClient}
            contractInfo={props.contractInfo}
            address={state.nftContract}
            onDone={(address) => onGetCollectionAddress(address)}
          />
        );
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
            tokenContractAddress={state.nftContract!}
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
