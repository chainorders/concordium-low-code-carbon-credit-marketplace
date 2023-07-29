import { Outlet, useNavigate } from "react-router-dom";

import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";

import { User } from "../../types/user";
import { ContractAddress } from "@concordium/web-sdk";

export default function MarketPage(props: { user: User; marketContract: ContractAddress }) {
  const { user, marketContract } = props;
  const navigate = useNavigate();
  const isWalletUser = () => {
    return user && user.accountType === "wallet" && user.account;
  };
  return (
    <Stack spacing={1} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Market ({marketContract.index.toString()}/{marketContract.subindex.toString()})
          </Typography>
          <Button color="inherit" onClick={() => navigate(`buy`)}>
            Buy
          </Button>
          <Button color="inherit" onClick={() => navigate("sell")} disabled={!isWalletUser()}>
            Sell
          </Button>
          <Button color="inherit" onClick={() => navigate("events")} disabled={!isWalletUser()}>
            Events
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
