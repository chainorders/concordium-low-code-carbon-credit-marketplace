import { Outlet, useNavigate } from 'react-router-dom';

import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

export default function CIS2Page() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            CIS2 Tokens
          </Typography>
          <Button color="inherit" onClick={(_) => navigate(`mint`)}>
            Mint
          </Button>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
