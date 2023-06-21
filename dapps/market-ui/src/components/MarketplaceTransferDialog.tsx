import { FormEvent, useEffect, useState } from 'react';

import { ContractAddress } from '@concordium/web-sdk';
import { Container } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { MARKETPLACE_CONTRACT_INFO } from '../Constants';
import { connectToWallet } from '../models/ConcordiumContractClient';
import { TokenListItem, transfer as transferWallet } from '../models/MarketplaceClient';
import { transfer as transferWert } from '../models/WertClient';
import { User } from '../types/user';
import DisplayError from './ui/DisplayError';

export default function MarketplaceTransferDialog(props: {
  isOpen: boolean;
  token: TokenListItem;
  marketContractAddress: ContractAddress;
  onClose: () => void;
  user: User;
}) {
  const { user } = props;
  const [open, setOpen] = useState(props.isOpen);
  const [form, setForm] = useState({
    quantity: props.token.quantity.toString(),
  });
  const [totalAmount, setTotalAmount] = useState<bigint>(props.token.quantity * props.token.price);

  const [state, setState] = useState<{
    isBought?: boolean;
    isProcessing?: boolean;
    error?: string;
  }>({});

  const handleClose = () => {
    setOpen(false);
    props.onClose();
  };

  const { token: item, marketContractAddress } = props;
  const transfer = (quantity: bigint) => {
    switch (user.accountType) {
      case "wallet":
        return connectToWallet().then((wallet) =>
          transferWallet({
            provider: wallet.provider,
            payerAccount: user.account,
            to: user.account,
            marketContractAddress,
            nftContractAddress: item.contract,
            tokenId: item.tokenId,
            priceCcd: item.price,
            owner: item.owner,
            quantity,
            contractInfo: MARKETPLACE_CONTRACT_INFO,
          }),
        );
      case "email":
        return transferWert(
          user.account,
          marketContractAddress,
          item.contract,
          item.tokenId,
          item.owner,
          quantity,
          totalAmount,
          "widget",
        );
    }

    return Promise.reject({ message: "Invalid Payment Type" });
  };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setState({
      ...state,
      isBought: false,
      isProcessing: true,
      error: "",
    });

    transfer(BigInt(form.quantity))
      .then(() => {
        setState({
          ...state,
          isBought: true,
          isProcessing: false,
          error: "",
        });
      })
      .catch((err) => {
        setState({
          ...state,
          isBought: false,
          isProcessing: false,
          error: err.message,
        });
      });
  }

  useEffect(() => setTotalAmount(BigInt(form.quantity) * props.token.price), [form.quantity]);

  function isValid() {
    if (!form.quantity || BigInt(form.quantity) <= 0 || BigInt(form.quantity) > props.token.quantity) {
      return false;
    }

    if (totalAmount <= 0) {
      return false;
    }

    if (state.isBought) {
      return false;
    }

    return true;
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={"md"}>
      <DialogTitle width={"500px"}>Buy Token: {props.token.tokenId}</DialogTitle>
      <form onSubmit={(e) => submit(e)}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="quantity"
            label={`Quantity (Max ${props.token.quantity})`}
            type="number"
            name="quantity"
            fullWidth
            variant="standard"
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            disabled={state.isBought || state.isProcessing}
            value={form.quantity}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{state.isBought ? "Ok" : "Cancel"}</Button>
          <Button type="submit" disabled={state.isBought || state.isProcessing || !isValid()}>
            Buy ({totalAmount.toString()} CCD)
          </Button>
        </DialogActions>
      </form>
      <DisplayError error={state.error} />
      <Container>
        <div id="widget" style={{ textAlign: "center" }}></div>
      </Container>
    </Dialog>
  );
}
