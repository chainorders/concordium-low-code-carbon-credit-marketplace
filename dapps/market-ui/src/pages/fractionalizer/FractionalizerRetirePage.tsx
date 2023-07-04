import { ConcordiumGRPCClient, ContractAddress } from "@concordium/web-sdk";
import { ArrowBackRounded } from "@mui/icons-material";
import { Container, Grid, IconButton, Paper, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { useState } from "react";
import { ContractInfo } from "../../models/ConcordiumContractClient";
import ContractFindInstance from "../../components/ContractFindInstance";
import { FractionalizerRetire } from "../../components/cis2-fractionalizer/FractionalizerRetire";

const enum Steps {
  FindCis2Contract,
  RetireToken,
}
type StepType = { step: Steps; title: string };

export default function FractionalizerRetirePage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  defaultContractAddress: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  const steps: StepType[] = [
    {
      step: Steps.FindCis2Contract,
      title: "Find Existing Contract",
    },
    {
      step: Steps.RetireToken,
      title: "Retire Token",
    },
  ];
  const [activeStep, setActiveStep] = useState<StepType>(steps[0]);
  const [address, setAddress] = useState<ContractAddress>(props.defaultContractAddress);

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
            <ContractFindInstance
              grpcClient={props.grpcClient}
              onDone={onCollectionFound}
              defaultContractAddress={props.defaultContractAddress}
            />
          </Stack>
        );
      case Steps.RetireToken:
        return (
          <FractionalizerRetire
            grpcClient={props.grpcClient}
            address={address!}
            contractInfo={props.contractInfo}
            onDone={() => console.log("tokens retired")}
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
