import './App.css';

import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { createConcordiumClient } from '@concordium/web-sdk';
import {
    AppBar, Box, Button, Container, createTheme, Link, styled, ThemeProvider, Toolbar, Typography
} from '@mui/material';

import GuardedRoute from './components/auth/GuardedRoute';
import UserAuth from './components/auth/UserAuth';
import MarketplaceTokensList from './components/MarketplaceTokensList';
import { useParamsContractAddress } from './components/utils';
import {
    CIS2_MULTI_CONTRACT_INFO, CONCORDIUM_NODE_PORT, CONNCORDIUM_NODE_ENDPOINT,
    FRACTIONALIZER_CONTRACT_ADDRESS, FRACTIONALIZER_CONTRACT_INFO, MARKET_CONTRACT_ADDRESS,
    MARKETPLACE_CONTRACT_INFO
} from './Constants';
import CIS2Page from './pages/cis2/CIS2Page';
import MintPage from './pages/cis2/MintPage';
import FractionalizerPage from './pages/fractionalizer/FractionalizerPage';
import FractionalizeTokenPage from './pages/fractionalizer/FractionalizeTokenPage';
import MarketFindOrInit from './pages/marketplace/MarketFindOrInit';
import MarketPage from './pages/marketplace/MarketPage';
import SellPage from './pages/marketplace/SellPage';
import { User } from './types/user';

const theme = createTheme({
  palette: {
    primary: {
      main: "#0d0d0d",
    },
    secondary: {
      main: "#95fcb2",
    },
  },
});

const HeaderButton = styled(Button)({
  "&&[disabled]": {
    color: "grey",
  },
});

const loggedOutUser: User = { account: "", accountType: "", email: "" };

function App() {
  const navigate = useNavigate();
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const fracContract = useParamsContractAddress() || FRACTIONALIZER_CONTRACT_ADDRESS;

  const [user, setUser] = useState<User>(loggedOutUser);
  const [state] = useState({
    grpcClient: createConcordiumClient(CONNCORDIUM_NODE_ENDPOINT, Number(CONCORDIUM_NODE_PORT)),
  });

  const isWalletUser = () => {
    return user && user.accountType === "wallet" && user.account;
  };

  return (
    <>
      <ThemeProvider theme={theme}>
        <AppBar position="static">
          <Container maxWidth={"xl"}>
            <Toolbar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h4" component="div">
                  Concordium
                </Typography>
              </Box>
              <HeaderButton color="inherit" onClick={() => navigate("/market")}>
                Market
              </HeaderButton>
              <HeaderButton color="inherit" onClick={() => navigate("/fractionalizer")} disabled={!isWalletUser()}>
                Fractionalizer
              </HeaderButton>
              <HeaderButton color="inherit" onClick={() => navigate("/cis2")} disabled={!isWalletUser()}>
                CIS2 Token Tools
              </HeaderButton>
              <UserAuth user={user} onLogin={setUser} onLogout={() => setUser(loggedOutUser)} />
            </Toolbar>
          </Container>
        </AppBar>
        <Box className="App">
          <Container maxWidth={"lg"}>
            <Routes>
              <Route path="/market" element={<MarketPage user={user} />} key="market">
                <Route
                  path="buy/:index/:subindex"
                  element={<MarketplaceTokensList grpcClient={state.grpcClient!} user={user} />}
                />
                <Route element={<GuardedRoute isRouteAccessible={!!user?.account} redirectRoute="/market" />}>
                  <Route
                    path="sell"
                    element={<SellPage grpcClient={state.grpcClient!} contractInfo={CIS2_MULTI_CONTRACT_INFO} />}
                  />
                  <Route
                    path="create"
                    element={
                      <MarketFindOrInit
                        grpcClient={state.grpcClient!}
                        contractInfo={MARKETPLACE_CONTRACT_INFO}
                        defaultContractAddress={marketContractAddress}
                        onDone={(address) => navigate(`buy/${address.index.toString()}/${address.subindex.toString()}`)}
                      />
                    }
                  />
                </Route>
                <Route
                  path=""
                  element={
                    <Navigate
                      to={`buy/${marketContractAddress.index.toString()}/${marketContractAddress.subindex.toString()}`}
                      replace={true}
                    />
                  }
                />
              </Route>
              <Route element={<GuardedRoute isRouteAccessible={!!user?.account} redirectRoute="/market" />}>
                <Route path="/cis2" element={<CIS2Page />} key="cis2">
                  <Route
                    path="mint"
                    element={
                      <MintPage
                        grpcClient={state.grpcClient!}
                        key={CIS2_MULTI_CONTRACT_INFO.contractName}
                        contractInfo={CIS2_MULTI_CONTRACT_INFO}
                      />
                    }
                  />
                  <Route path="" element={<Navigate to={"mint"} replace={true} />} />
                </Route>
              </Route>
              <Route element={<GuardedRoute isRouteAccessible={!!user?.account} redirectRoute="/market" />}>
                <Route path="/fractionalizer" element={<FractionalizerPage/>}>
                  <Route
                    path="fractionalize"
                    element={
                      <FractionalizeTokenPage
                        grpcClient={state.grpcClient!}
                        contractInfo={FRACTIONALIZER_CONTRACT_INFO}
                        defaultContractAddress={fracContract}
                      />
                    }
                  />
                  <Route
                    path=""
                    element={
                      <Navigate
                        to={`fractionalize`}
                        replace={true}
                      />
                    }
                  />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to={"/market"} replace={true} />} />
            </Routes>
          </Container>
        </Box>
        <footer className="footer">
          <Typography textAlign={"center"} sx={{ color: "white" }}>
            <Link
              sx={{ color: "white" }}
              href="https://developer.concordium.software/en/mainnet/net/guides/low-code-nft-marketplace/introduction.html"
              target={"_blank"}
            >
              Visit the Concordium documentation portal to create your own marketplace in a few minutes!
            </Link>
          </Typography>
        </footer>
      </ThemeProvider>
    </>
  );
}

export default App;
