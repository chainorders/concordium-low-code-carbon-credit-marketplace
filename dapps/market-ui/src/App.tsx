import "./App.css";

import { useEffect, useState } from "react";
import { detectConcordiumProvider, WalletApi } from "@concordium/browser-wallet-api-helpers";
import { AppBar, Box, Button, Container, Link, ThemeProvider, Toolbar, Typography, createTheme } from "@mui/material";
import { Route, Routes, useParams, Navigate, useNavigate } from "react-router-dom";
import { ConcordiumGRPCClient, createConcordiumClient } from "@concordium/web-sdk";

import MarketFindOrInit from "./pages/marketplace/MarketFindOrInit";
import {
  CIS2_MULTI_CONTRACT_INFO,
  CONCORDIUM_NODE_PORT,
  CONNCORDIUM_NODE_ENDPOINT,
  FRACTIONALIZER_CONTRACT_ADDRESS,
  FRACTIONALIZER_CONTRACT_INFO,
  MARKETPLACE_CONTRACT_INFO,
  MARKET_CONTRACT_ADDRESS,
} from "./Constants";
import ConnectWallet from "./components/ConnectWallet";
import MarketPage from "./pages/marketplace/MarketPage";
import CIS2Page from "./pages/cis2/CIS2Page";
import SellPage from "./pages/marketplace/SellPage";
import FractionalizerPage from "./pages/fractionalizer/FractionalizerPage";
import MarketplaceTokensList from "./components/MarketplaceTokensList";
import MintPage from "./pages/cis2/MintPage";
import FractionalizeToken from "./components/cis2-fractionalizer/FractionalizeToken";
import FractionalizerFindOrInit from "./pages/fractionalizer/FractionalizerFindOrInit";
import { useParamsContractAddress } from "./components/utils";

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

  const [state, setState] = useState<{
    grpcClient: ConcordiumGRPCClient;
    provider?: WalletApi;
    account?: string;
  }>({
    grpcClient: createConcordiumClient(CONNCORDIUM_NODE_ENDPOINT, Number(CONCORDIUM_NODE_PORT)),
  });

  function connect() {
    detectConcordiumProvider()
      .then((provider) => {
        provider
          .getMostRecentlySelectedAccount()
          .then((account) => (account ? Promise.resolve(account) : provider.connect()))
          .then((account) => {
            setState({ ...state, provider, account });
          })
          .catch(() => {
            alert("Please allow wallet connection");
          });
        provider.on("accountDisconnected", () => {
          setState({ ...state, account: undefined });
        });
        provider.on("accountChanged", (account) => {
          setState({ ...state, account });
        });
        provider.on("chainChanged", () => {
          setState({ ...state, account: undefined, provider: undefined });
        });
      })
      .catch(() => {
        console.error(`could not find provider`);
        alert("Please download Concordium Wallet");
      });
  }

  useEffect(() => {
    if (state.provider && state.account) {
      return;
    }

    connect();
    return () => {
      state.provider?.removeAllListeners();
    };
  }, [state.account]);

  function isConnected() {
    return !!state.provider && !!state.account;
  }

  if (!isConnected()) {
    return <ConnectWallet connect={connect} />;
  }

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
                <Route
                  path="buy/:index/:subindex"
                  element={
                    <MarketplaceTokensList
                      grpcClient={state.grpcClient!}
                      account={state.account!}
                      provider={state.provider!}
                    />
                  }
                />
                <Route
                  path="sell"
                  element={
                    <SellPage
                      grpcClient={state.grpcClient!}
                      provider={state.provider!}
                      account={state.account!}
                      contractInfo={CIS2_MULTI_CONTRACT_INFO}
                    />
                  }
                />
                <Route
                  path="create"
                  element={
                    <MarketFindOrInit
                      grpcClient={state.grpcClient!}
                      provider={state.provider!}
                      account={state.account!}
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
                      provider={state.provider!}
                      account={state.account!}
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
                      provider={state.provider!}
                      account={state.account!}
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
                      provider={state.provider!}
                      account={state.account!}
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
