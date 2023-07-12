import { Outlet, useNavigate } from 'react-router-dom';

import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

export default function VerifyPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Project NFT Verification
          </Typography>
          <Button color="inherit" onClick={() => navigate(`add`)}>
            Add Verifier
          </Button>
          <Button color="inherit" onClick={() => navigate(`remove`)}>
            Remove Verifier
          </Button>
          <Button color="inherit" onClick={() => navigate(`verify`)}>
            Verify
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
