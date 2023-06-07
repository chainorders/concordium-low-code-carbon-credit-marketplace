import jwtDecode from 'jwt-decode';
import { FormEvent, useEffect, useState } from 'react';

import { ContractAddress } from '@concordium/web-sdk';
import {
    Container, FormControl, FormControlLabel, FormGroup, FormLabel, Radio, RadioGroup
} from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

import { GOOGLE_CLIENT_ID, MARKETPLACE_CONTRACT_INFO } from '../Constants';
import { getUserCurrent } from '../models/AuthClient';
import { connectToWallet } from '../models/ConcordiumContractClient';
import { TokenListItem, transfer as transferWallet } from '../models/MarketplaceClient';
import { transfer as transferWert } from '../models/WertClient';
import DisplayError from './ui/DisplayError';

export default function MarketplaceTransferDialog(props: {
  isOpen: boolean;
  token: TokenListItem;
  marketContractAddress: ContractAddress;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(props.isOpen);
  const [form, setForm] = useState({
    email: "",
    paymentType: "",
    quantity: props.token.quantity.toString(),
    accountType: "",
  });
  const [totalAmount, setTotalAmount] = useState<bigint>(props.token.quantity * props.token.price);
  const [account, setAccount] = useState("");

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
    switch (form.paymentType) {
      case "wallet":
        return connectToWallet().then((wallet) =>
          transferWallet(
            wallet.provider,
            wallet.account,
            account,
            marketContractAddress,
            item.contract,
            item.tokenId,
            item.price,
            item.owner,
            quantity,
            MARKETPLACE_CONTRACT_INFO,
          ),
        );
      case "wert":
        return transferWert(
          account,
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
      .then((_) => {
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

  useEffect(() => {
    setAccount("");
    setState({ ...state, error: "" });

    if (form.accountType === "wallet") {
      connectToWallet()
        .then((wallet) => setAccount(wallet.account))
        .catch((err) => {
          setState({ ...state, error: err.message });
        });
    }
  }, [form.accountType]);

  useEffect(() => {
    if (form.accountType === "email" && form.email) {
      setState({ ...state, error: "" });
      getUserCurrent(form.email)
        .then((user) => setAccount(user.account))
        .catch((err) => {
          setState({ ...state, error: err.message });
        });
    }
  }, [form.email]);

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

    if (!form.accountType || !account) {
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
          <FormGroup>
            <FormControl fullWidth variant="outlined">
              <FormLabel id="account-type-radio-buttons-group-label">Account Type?</FormLabel>
              <RadioGroup>
                <FormControlLabel
                  value="wallet"
                  control={
                    <Radio
                      onChange={() => setForm({ ...form, accountType: "wallet" })}
                      disabled={state.isBought || state.isProcessing}
                      checked={form.accountType === "wallet"}
                    />
                  }
                  label="Wallet Account"
                />
                <FormControlLabel
                  value="email"
                  control={
                    <Radio
                      onChange={() => setForm({ ...form, accountType: "email" })}
                      disabled={state.isBought || state.isProcessing}
                      checked={form.accountType === "email"}
                    />
                  }
                  label="Enterprise Account"
                />
              </RadioGroup>
            </FormControl>
            {form.accountType === "email" && (
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    const res = jwtDecode(credentialResponse.credential!) as any;
                    console.log(res.email);
                    setForm({ ...form, email: res.email });
                  }}
                  onError={() => {
                    console.log("Login Failed");
                  }}
                  shape="rectangular"
                  size="large"
                />
              </GoogleOAuthProvider>
            )}
            <TextField fullWidth label="Account" variant="standard" disabled value={account} />
          </FormGroup>

          <FormControl fullWidth>
            <FormLabel id="demo-radio-buttons-group-label">Payment Via?</FormLabel>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              defaultValue="female"
              name="radio-buttons-group"
            >
              <FormControlLabel
                value="wallet"
                control={
                  <Radio
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                    disabled={state.isBought || state.isProcessing}
                    checked={form.paymentType === "wallet"}
                  />
                }
                label="Wallet"
              />
              <FormControlLabel
                value="wert"
                control={
                  <Radio
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                    disabled={state.isBought || state.isProcessing}
                    checked={form.paymentType === "wert"}
                  />
                }
                label="Credit Card"
              />
            </RadioGroup>
          </FormControl>
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
        <div id="widget" style={{textAlign: "center"}}></div>
      </Container>
    </Dialog>
  );
}
