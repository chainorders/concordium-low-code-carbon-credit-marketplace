
import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import {
    Container, Paper} from '@mui/material';

import { ProjectRetract } from '../../components/cis2/ProjectRetract';
import { ContractInfo } from '../../models/ConcordiumContractClient';

export default function ProjectRetractPage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  tokenContract: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  const { tokenContract } = props;
  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Paper sx={{ padding: "20px" }} variant="outlined">
      <ProjectRetract
            grpcClient={props.grpcClient}
            projectContract={tokenContract}
            contractInfo={props.contractInfo}
            onDone={() => console.log("tokens retracted")}
          />
      </Paper>
    </Container>
  );
}
