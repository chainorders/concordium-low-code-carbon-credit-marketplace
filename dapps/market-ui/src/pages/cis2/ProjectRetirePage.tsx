
import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import {
    Container, Paper} from '@mui/material';

import { ProjectRetire } from '../../components/cis2/ProjectRetire';
import { ContractInfo } from '../../models/ConcordiumContractClient';

export default function ProjectRetirePage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  tokenContract: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  const { tokenContract} = props;
  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Paper sx={{ padding: "20px" }} variant="outlined">
      <ProjectRetire
            grpcClient={props.grpcClient}
            address={tokenContract!}
            contractInfo={props.contractInfo}
            onDone={() => console.log("tokens retired")}
          />
      </Paper>
    </Container>
  );
}
