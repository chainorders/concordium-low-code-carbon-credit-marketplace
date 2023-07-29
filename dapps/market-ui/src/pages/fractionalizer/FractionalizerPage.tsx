import { Outlet, useNavigate } from 'react-router-dom';

import { AppBar, Button, Stack, Toolbar, Typography } from '@mui/material';

export default function FractionalizerPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Fractionalizer
          </Typography>
          <Button color="inherit" onClick={() => navigate(`fractionalize`)}>
            Fractionalize
          </Button>
          <Button color="inherit" onClick={() => navigate(`retire`)}>
            Retire
          </Button>
          <Button color="inherit" onClick={() => navigate(`Events`)}>
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
