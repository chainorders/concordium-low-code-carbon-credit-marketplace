
import { ConcordiumGRPCClient, ContractAddress } from '@concordium/web-sdk';
import {
    Container, Paper} from '@mui/material';

import { FractionalizerRetire } from '../../components/cis2-fractionalizer/FractionalizerRetire';
import { ContractInfo } from '../../models/ConcordiumContractClient';

export default function FractionalizerRetirePage(props: {
  grpcClient: ConcordiumGRPCClient;
  contractInfo: ContractInfo;
  defaultContractAddress: ContractAddress;
  onDone: (address: ContractAddress) => void;
}) {
  return (
    <Container sx={{ maxWidth: "xl", pt: "10px" }}>
      <Paper sx={{ padding: "20px" }} variant="outlined">
      <FractionalizerRetire
            grpcClient={props.grpcClient}
            address={props.defaultContractAddress!}
            contractInfo={props.contractInfo}
            onDone={() => console.log("tokens retired")}
          />
      </Paper>
    </Container>
  );
}
