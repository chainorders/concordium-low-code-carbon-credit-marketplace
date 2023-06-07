import { TransactionStatusEnum } from '@concordium/web-sdk';
import { Alert, CircularProgress, Link, Stack, Typography } from '@mui/material';

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
    <>
      {isInProcess() ? <CircularProgress /> : <CircularProgress variant="determinate" value={100} />}
      {props.hash && (
        <Stack>
          <Typography variant="body1">Transaction hash: {props.hash}</Typography>
          <Typography variant="body1">Transaction Status: {props.status}</Typography>
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
    </>
  );
}
