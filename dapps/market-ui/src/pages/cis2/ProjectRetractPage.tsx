import { useState } from 'react';

import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import { ArrowBackRounded } from '@mui/icons-material';
import {
    Container, Grid, IconButton, Paper, Stack, Step, StepLabel, Stepper, Typography
} from '@mui/material';

import Cis2FindInstance from '../../components/cis2/Cis2FindInstance';
import { ProjectRetract } from '../../components/cis2/ProjectRetract';
import { Cis2ContractInfo } from '../../models/ConcordiumContractClient';

const enum Steps {
  FindCis2Contract,
  RetractToken,
}
type StepType = { step: Steps; title: string };

export default function ProjectRetractPage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: Cis2ContractInfo;
  address?: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  const steps: StepType[] = [
    {
      step: Steps.FindCis2Contract,
      title: "Find Existing Project NFT Collection",
    },
    {
      step: Steps.RetractToken,
      title: "Retract Token",
    },
  ];
  const [activeStep, setActiveStep] = useState<StepType>(steps[0]);
  const [address, setAddress] = useState<ContractAddress | undefined>(props.address);

  function goBack(): void {
    const activeStepIndex = steps.findIndex((s) => s.step === activeStep.step);
    const previousStepIndex = Math.max(activeStepIndex - 1, 0);
    setActiveStep(steps[previousStepIndex]);
  }

  const onCollectionFound = (address: ContractAddress) => {
    setAddress(address);
    setActiveStep(steps[1]);
  };

  const StepContent = () => {
    switch (activeStep.step) {
      case Steps.FindCis2Contract:
        return (
          <Stack spacing={2}>
            <Cis2FindInstance
              grpcClient={props.grpcClient}
              contractInfo={props.contractInfo}
              address={props.address}
              onDone={onCollectionFound}
            />
          </Stack>
        );
      case Steps.RetractToken:
        return (
          <ProjectRetract
            grpcClient={props.grpcClient}
            address={address!}
            contractInfo={props.contractInfo}
            onDone={() => console.log("tokens retracted")}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Stepper activeStep={activeStep.step} alternativeLabel sx={{ padding: "20px" }}>
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
              {activeStep.title}
            </Typography>
          </Grid>
        </Grid>
        <StepContent />
      </Paper>
    </Container>
  );
}
