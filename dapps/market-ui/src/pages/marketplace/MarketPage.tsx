import { Outlet, useNavigate } from 'react-router-dom';

import { AddCircleOutline } from '@mui/icons-material';
import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

import { useParamsContractAddress } from '../../components/utils';
import { MARKET_CONTRACT_ADDRESS } from '../../Constants';
import { User } from '../../types/user';

export default function MarketPage(props: { user: User }) {
  const { user } = props;
  const navigate = useNavigate();
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const isWalletUser = () => {
    return user && user.accountType === "wallet" && user.account;
  };
  return (
    <Stack spacing={1} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Market ({marketContractAddress.index.toString()}/{marketContractAddress.subindex.toString()})
          </Typography>
          <Button
            color="inherit"
            onClick={() =>
              navigate(`buy/${marketContractAddress.index.toString()}/${marketContractAddress.subindex.toString()}`)
            }
          >
            Buy
          </Button>
          <Button color="inherit" onClick={() => navigate("sell")} disabled={!isWalletUser()}>
            Sell
          </Button>
          <Button color="inherit" onClick={() => navigate("create")} disabled={!isWalletUser()}>
            <AddCircleOutline sx={{ mr: 1 }} />
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
