import { TransactionStatusEnum } from "@concordium/web-sdk";
import { CircularProgress, Link, Typography } from "@mui/material";
import { EXPLORER_URL_TXN_HASH } from "../../Constants";

export default function TransactionProgress(props: {
  inProgress: boolean;
  hash: string | undefined;
  status: TransactionStatusEnum | undefined;
}) {
  return (
    <>
      {props.inProgress ? <CircularProgress /> : <></>}
      {props.hash && (
        <Link href={`${EXPLORER_URL_TXN_HASH}${props.hash}`} component={"div"}>
          {props.status === TransactionStatusEnum.Committed ? <Typography>Transaction committed</Typography> : ""}
          {props.status === TransactionStatusEnum.Finalized ? <Typography>Transaction Finalized</Typography> : ""}
          {props.status === TransactionStatusEnum.Received ? <Typography>Transaction Recieved</Typography> : ""}
        </Link>
      )}
    </>
  );
}
