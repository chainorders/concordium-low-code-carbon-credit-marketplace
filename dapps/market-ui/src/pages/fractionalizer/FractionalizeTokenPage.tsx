import { Buffer } from 'buffer/';
import React, { useState } from 'react';

import { CIS2Contract, ConcordiumGRPCClient, ContractAddress, sha256 } from '@concordium/web-sdk';
import { ArrowBackRounded } from '@mui/icons-material';
import { Grid, IconButton, Paper, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { Container } from '@mui/system';

import FractionalizerMint from '../../components/cis2-fractionalizer/FractionalizerMint';
import PrepareMetadata from '../../components/cis2-fractionalizer/PrepareMetadata';
import UploadMetadata from '../../components/cis2-fractionalizer/UploadMetadata';
import Cis2TokensDisplay from '../../components/cis2/Cis2TokensDisplay';
import Cis2Transfer from '../../components/cis2/Cis2Transfer';
import { ContractInfo } from '../../models/ConcordiumContractClient';
import { getCarbonCreditQuantityAttribute } from '../../models/ProjectFractionalizerClient';
import { Metadata } from '../../models/ProjectNFTClient';
import {
    FractionalizerEvent, FractionalizerMintEvent, FractionalizerTokenMetadataEvent, ModuleEvent
} from '../../models/web/Events';
import FractionalizerFindOrInit from './FractionalizerFindOrInit';

enum Steps {
  GetOrInitContract = 0,
  TrasferCis2Token = 1,
  PrepareMetadata = 2,
  UploadMetadata = 3,
  Mint = 4,
  Minted = 5
}

type StepType = { step: Steps; title: string };

type MintMethodEvents = {
  mint: FractionalizerMintEvent;
  tokenMetadata: FractionalizerTokenMetadataEvent;
};

function FractionalizeTokenPage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  defaultContractAddress: ContractAddress;
}) {
  const steps: StepType[] = [
    {
      step: Steps.GetOrInitContract,
      title: "Create New or Find Fractionalizer Contract",
    },
    {
      step: Steps.TrasferCis2Token,
      title: "Transfer the token to be fractionalized",
    },
    {
      step: Steps.PrepareMetadata,
      title: "Prepare Metadata",
    },
    {
      step: Steps.UploadMetadata,
      title: "Upload Metadata",
    },
    { step: Steps.Mint, title: "Mint" },
    { step: Steps.Minted, title: "Minted" },
  ];

  const [step, setStep] = useState<StepType>(steps[0]);
  const [contract, setContract] = useState<ContractAddress>(props.defaultContractAddress);
  const [token, setToken] = useState<{
    address: ContractAddress;
    tokenId: string;
    quantity: string;
    contractname: string;
    cis2Contract: CIS2Contract;
  }>();
  const [quantity, setQuantity] = useState<string>("");
  const [metadata, setMetadata] = useState<{ metadata: Metadata; hash: string }>({
    metadata: {},
    hash: "",
  });
  const [metadataUrl, setMetadataUrl] = useState<{ url: string; hash: string }>();
  const [mintedTokens, setMintedTokens] = useState<MintMethodEvents[]>([]);

  function goForward() {
    if (step.step === steps.length - 1) {
      return;
    }

    setStep(steps[step.step + 1]);
  }

  function goBack(): void {
    if (step.step === 0) {
      return;
    }
    setStep(steps[step.step - 1]);
  }

  function onGetContractAddress(address: ContractAddress) {
    setContract(address);
    goForward();
  }

  function onTransferred(address: ContractAddress, tokenId: string, contractname: string, quantity: string) {
    const cis2Contract = new CIS2Contract(props.grpcClient, address, contractname);
    setToken({ address, tokenId, quantity, contractname, cis2Contract });
    goForward();
  }

  function onMetadataPrepared(metadata: Metadata) {
    const hash = sha256([Buffer.from(JSON.stringify(metadata))]).toString("hex");
    setMetadata({ metadata, hash });
    const quantity = metadata.attributes?.find((a) => a.name == getCarbonCreditQuantityAttribute().name)?.value;
    if (quantity) {
      setQuantity(quantity);
    }

    goForward();
  }

  function onMetadataUploaded(metadataUrl: string) {
    setMetadataUrl({ url: metadataUrl, hash: metadata.hash });
    goForward();
  }

  function onTokensMinted(mintedEvents: ModuleEvent[]) {
    const mintedTokens: { [tokenId: string]: MintMethodEvents } = {};
    (mintedEvents as FractionalizerEvent[]).forEach((event) => {
      if (event.Mint) {
        const token = mintedTokens[event.Mint.token_id] || {};
        token.mint = event.Mint;
        mintedTokens[event.Mint.token_id] = token;
      } else if (event.TokenMetadata) {
        const token = mintedTokens[event.TokenMetadata.token_id] || {};
        token.tokenMetadata = event.TokenMetadata;
        mintedTokens[event.TokenMetadata.token_id] = token;
      }
    });

    setMintedTokens(Object.values(mintedTokens));
    goForward();
  }

  function StepContent() {
    switch (step.step) {
      case Steps.GetOrInitContract:
        return (
          <FractionalizerFindOrInit
            grpcClient={props.grpcClient}
            contractInfo={props.contractInfo}
            defaultContractAddress={contract}
            onDone={(address) => onGetContractAddress(address)}
          />
        );
      case Steps.TrasferCis2Token:
        return (
          <Cis2Transfer
            grpcClient={props.grpcClient}
            to={{
              address: contract,
              hookName: "onCis2Recieved",
            }}
            onDone={(address, tokenId, contractName, quantity) =>
              onTransferred(address, tokenId, contractName, quantity)
            }
            defaultQuantity="1"
            quantityDisabled
          />
        );
      case Steps.PrepareMetadata:
        return (
          <PrepareMetadata
            collateralTokenContract={token!.cis2Contract!}
            collateralTokenId={token!.tokenId}
            onMetadataPrepared={onMetadataPrepared}
          />
        );
      case Steps.UploadMetadata:
        return (
          <UploadMetadata
            contents={metadata.metadata}
            fileName={`${metadata.hash}.json`}
            onMetadataUploaded={onMetadataUploaded}
          />
        );
      case Steps.Mint:
        return (
          <FractionalizerMint
            collateralContractAddress={token!.address}
            collateralTokenId={token!.tokenId}
            fracContractAddress={contract}
            defaultTokenId="01"
            defaultTokenQuantity={quantity}
            disableQuantityUpdate={!!quantity}
            defaultMetadataUrl={metadataUrl!.url}
            disableMetadataUrlUpdate
            defaultMetadataHash={metadataUrl!.hash}
            disableMetadataHashUpdate
            onDone={onTokensMinted}
          />
        );
        case Steps.Minted:
          return <Cis2TokensDisplay tokens={mintedTokens} />;
      default:
        return <>Invalid Step</>;
    }
  }

  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Stepper activeStep={step.step} alternativeLabel sx={{ padding: "20px" }}>
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
              {step.title}
            </Typography>
          </Grid>
        </Grid>
        <StepContent />
      </Paper>
    </Container>
  );
}

export default FractionalizeTokenPage;
