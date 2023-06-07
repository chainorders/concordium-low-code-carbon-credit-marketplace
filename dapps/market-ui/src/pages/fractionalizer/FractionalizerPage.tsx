import { Outlet, useNavigate } from 'react-router-dom';

import { ContractAddress } from '@concordium/web-sdk';
import { AddCircleOutline } from '@mui/icons-material';
import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

export default function FractionalizerPage(props: { fracContract: ContractAddress }) {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Fractionalizer ({props.fracContract.index.toString()}/{props.fracContract.subindex.toString()})
          </Typography>
          <Button
            color="inherit"
            onClick={(_) =>
              navigate(`fractionalize/${props.fracContract.index.toString()}/${props.fracContract.subindex.toString()}`)
            }
          >
            Fractionalize
          </Button>
          <Button color="inherit" onClick={(_) => navigate("create")}>
            <AddCircleOutline sx={{ mr: 1 }} />
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
