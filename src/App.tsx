import React from 'react';
// routing
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
// redux
import { connect } from 'react-redux';
import { setExValue } from './redux/actions/ex-actions';
// ethereum wallet
import * as ethers from 'ethers';
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from '@web3-react/frame-connector';
import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';

// GQL
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery, gql } from '@apollo/client';

// not currently used
import { useEagerConnect, useInactiveListener } from './hooks';
import {
  injected,
  //network,
  //walletconnect,
  //walletlink,
  //ledger,
  //trezor,
  //lattice,
  //frame,
  //authereum,
  //fortmatic,
  //magic,
  //torus
  //portis,
} from './connectors';
import { isPropertySignature } from 'typescript';
//import faker from 'faker';
//import contract from './utils/instantiate-contract';
//require('zAuction.json');
//import { isCompositeComponent } from 'react-dom/test-utils';

//spinnner css
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

// imports
import './App.css';
import {UserProvider} from './contexts/userContext';
import {AuctionProvider} from './contexts/auctionContext';
import Titlebar from './components/Titlebar/Titlebar';
import AuctionsView from './components/AuctionsView/AuctionsView';
import ProfileView from './components/ProfileView/ProfileView';
import CreateView from './components/CreateView/CreateView';
import AuctionDetails from './components/AuctionDetails/AuctionDetails';


// GQL query code
//
// //console.log("SUBGRAPH URL IS",process.env.REACT_APP_SUBGRAPH_URL);
 const client = new ApolloClient({
   // uri: "https://api.thegraph.com/subgraphs/name/wighawag/eip721-subgraph",
   uri: process.env.REACT_APP_SUBGRAPH_URL,
   cache: new InMemoryCache(),
 });
// const tokenQuery = gql`
// { tokens { contract tokenID owner tokenURI } }
// `;
 const nftByPopularity = gql`
 {
   tokenContracts(orderBy: numOwners, orderDirection: desc, first: 100) {
     id
     name
     numTokens
     numOwners
     supportsEIP721Metadata
   }
 }
 `;

// web3react
function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider, 'any');
  library.pollingInterval = 12000;
  return library;
}
function getErrorMessage(error: any) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return 'Please authorize this website to access your Ethereum account.'
  } else {
    console.error(error)
    return 'An unknown error occurred. Check the console for more details.'
  }
}

function App() {
  const { connector, account, library } = useWeb3React();
  const { data, loading, error } = useQuery(nftByPopularity);

  const nftcontractaddress = "0x101eD6EeC2CB7813a04614cA97421119219AfC1a";
  const nfttokenid = "0x0";

  return (
    <div className="app">
    	<Titlebar />
      <div className="body">
        <Switch>
          <Route 
            path="/"
            exact
            component={AuctionsView}
          />
          <Route path="/profile" component={ProfileView}/>
          <Route path="/create" component={CreateView}/>
          <Route path="/auctionDetails/:auctionId" component={AuctionDetails}/>
        </Switch>

      </div>

    </div>
  );
}

function wrappedApp() {
  return (
    <ApolloProvider client={client}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <UserProvider>
          <AuctionProvider>
            <App />
          </AuctionProvider>
        </UserProvider>
      </Web3ReactProvider>
    </ApolloProvider>
  );
}

const mapDispatchToProps = (dispatch: (arg0: { type: string; payload: any; }) => any) => ({
  setExValue: (exValue: any) => dispatch(setExValue(exValue))
})

export default connect(null,mapDispatchToProps)(wrappedApp);