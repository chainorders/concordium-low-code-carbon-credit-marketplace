import { Outlet, useNavigate } from "react-router-dom";

import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";
import { ContractAddress } from "@concordium/web-sdk";

export default function CIS2Page(props: { tokenContract: ContractAddress }) {
  const navigate = useNavigate();
  const { tokenContract } = props;

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Project Token ({tokenContract.index.toString()}/{tokenContract.subindex.toString()})
          </Typography>
          <Button color="inherit" onClick={() => navigate(`mint`)}>
            Mint
          </Button>
          <Button color="inherit" onClick={() => navigate(`retire`)}>
            Retire
          </Button>
          <Button color="inherit" onClick={() => navigate(`retract`)}>
            Retract
          </Button>
          <Button color="inherit" onClick={() => navigate(`events`)}>
            Events
          </Button>
          <Button color="inherit" onClick={() => navigate(`balanceOf`)}>
            Balance
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
