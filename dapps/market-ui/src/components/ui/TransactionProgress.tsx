import { TransactionStatusEnum } from '@concordium/web-sdk';
import { Check } from '@mui/icons-material';
import { Alert, CircularProgress, Container, Fab, Link, Stack, Typography } from '@mui/material';

import { EXPLORER_URL_TXN_HASH } from '../../Constants';

export default function TransactionProgress(props: { hash: string; status: TransactionStatusEnum }) {
  const isInProcess = () => {
    switch (props.status) {
      case TransactionStatusEnum.Finalized:
        return false;
      case TransactionStatusEnum.Received:
      case TransactionStatusEnum.Committed:
      default:
        return true;
    }
  };

  return (
    <Container>
      {isInProcess() ? <CircularProgress /> : <Fab color="success"><Check /></Fab>}
      {props.hash && (
        <Stack spacing={1}>
          <Typography variant="body1">Transaction hash: {props.hash}</Typography>
          <Link href={`${EXPLORER_URL_TXN_HASH}${props.hash}`} sx={{ display: "block" }} target="_blank">
            <Typography>
              {props.status === TransactionStatusEnum.Committed ? "Transaction committed" : ""}
              {props.status === TransactionStatusEnum.Finalized ? "Transaction Finalized" : ""}
              {props.status === TransactionStatusEnum.Received ? "Transaction Recieved" : ""}
            </Typography>
          </Link>
          <Alert severity="info">
            <Typography variant="body1" textAlign="center" sx={{ width: "100%" }}>
              Please note that it can take up to 30 seconds before the transaction is visible on the blockchain.
            </Typography>
          </Alert>
        </Stack>
      )}
    </Container>
  );
}
