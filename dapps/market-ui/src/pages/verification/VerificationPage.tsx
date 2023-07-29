import { Outlet, useNavigate } from "react-router-dom";

import { AppBar, Button, Stack, Toolbar, Typography } from "@mui/material";
import { ContractAddress } from "@concordium/web-sdk";

export default function VerifyPage(props: { tokenContract: ContractAddress }) {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Project Verification ({props.tokenContract.index.toString()}/{props.tokenContract.subindex.toString()})
          </Typography>
          <Button color="inherit" onClick={() => navigate(`verify`)}>
            Verify
          </Button>
          <Button color="inherit" onClick={() => navigate(`retract`)}>
            Retract
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
