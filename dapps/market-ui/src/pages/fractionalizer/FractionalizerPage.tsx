import { Outlet } from 'react-router-dom';

import { AppBar, Stack, Toolbar, Typography } from '@mui/material';

export default function FractionalizerPage() {

  return (
    <Stack spacing={2} mt={1}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography textAlign={"left"} variant="h5" component={"div"} sx={{ flexGrow: 1 }}>
            Fractionalizer
          </Typography>
        </Toolbar>
      </AppBar>
      <Outlet />
    </Stack>
  );
}
