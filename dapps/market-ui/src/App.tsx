import './App.css';

import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { ConcordiumGRPCClient, createConcordiumClient } from '@concordium/web-sdk';
import {
    AppBar, Box, Button, Container, createTheme, Link, ThemeProvider, Toolbar, Typography
} from '@mui/material';

import FractionalizeToken from './components/cis2-fractionalizer/FractionalizeToken';
import MarketplaceTokensList from './components/MarketplaceTokensList';
import { useParamsContractAddress } from './components/utils';
import {
    CIS2_MULTI_CONTRACT_INFO, CONCORDIUM_NODE_PORT, CONNCORDIUM_NODE_ENDPOINT,
    FRACTIONALIZER_CONTRACT_ADDRESS, FRACTIONALIZER_CONTRACT_INFO, MARKET_CONTRACT_ADDRESS,
    MARKETPLACE_CONTRACT_INFO
} from './Constants';
import CIS2Page from './pages/cis2/CIS2Page';
import MintPage from './pages/cis2/MintPage';
import FractionalizerFindOrInit from './pages/fractionalizer/FractionalizerFindOrInit';
import FractionalizerPage from './pages/fractionalizer/FractionalizerPage';
import MarketFindOrInit from './pages/marketplace/MarketFindOrInit';
import MarketPage from './pages/marketplace/MarketPage';
import SellPage from './pages/marketplace/SellPage';

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

function App() {
  const navigate = useNavigate();
  const marketContractAddress = useParamsContractAddress() || MARKET_CONTRACT_ADDRESS;
  const fracContract = useParamsContractAddress() || FRACTIONALIZER_CONTRACT_ADDRESS;

  const [state] = useState<{
    grpcClient: ConcordiumGRPCClient;
  }>({
    grpcClient: createConcordiumClient(CONNCORDIUM_NODE_ENDPOINT, Number(CONCORDIUM_NODE_PORT)),
  });

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
              <Button color="inherit" onClick={() => navigate("/market")}>
                Market
              </Button>
              <Button color="inherit" onClick={() => navigate("/fractionalizer")}>
                Fractionalizer
              </Button>
              <Button color="inherit" onClick={() => navigate("/cis2")}>
                CIS2 Token Tools
              </Button>
            </Toolbar>
          </Container>
        </AppBar>
        <Box className="App">
          <Container maxWidth={"lg"}>
            <Routes>
              <Route path="/market" element={<MarketPage />} key="market">
                <Route path="buy/:index/:subindex" element={<MarketplaceTokensList grpcClient={state.grpcClient!} />} />
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
                      onDone={(address) => navigate(`buy/${address.index.toString()}/${address.subindex.toString()}`)}
                    />
                  }
                />
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
              <Route path="/fractionalizer" element={<FractionalizerPage fracContract={fracContract} />}>
                <Route
                  path="fractionalize/:index/:subindex"
                  element={
                    <FractionalizeToken
                      grpcClient={state.grpcClient!}
                      fracContractAddress={fracContract}
                      contractInfo={CIS2_MULTI_CONTRACT_INFO}
                    />
                  }
                />
                <Route
                  path="create"
                  element={
                    <FractionalizerFindOrInit
                      grpcClient={state.grpcClient!}
                      contractInfo={FRACTIONALIZER_CONTRACT_INFO}
                      onDone={(address) =>
                        navigate(`fractionalize/${address.index.toString()}/${address.subindex.toString()}`)
                      }
                    />
                  }
                />
                <Route
                  path=""
                  element={
                    <Navigate
                      to={`fractionalize/${fracContract.index.toString()}/${fracContract.subindex.toString()}`}
                      replace={true}
                    />
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to={"/market"} replace={true} />} />
            </Routes>
          </Container>
        </Box>
        <footer className="footer">
          <Typography textAlign={"center"} sx={{ color: "white" }}>
            {/* <Link sx={{color: "white"}} href="https://developer.concordium.software/en/mainnet/index.html" target={"_blank"}>Concordium Developer Documentation</Link> */}
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
