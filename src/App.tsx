import React from 'react';
import { connect } from 'react-redux';
import fleek from '@fleekhq/fleek-storage-js';
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector';
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from '@web3-react/frame-connector';
import { ExternalProvider, JsonRpcFetchFunc, Web3Provider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery, gql } from '@apollo/client';
import faker from 'faker';

import { setExValue } from './redux/actions/ex-actions';

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

import './App.css';
import nft from './nft.png';
import Titlebar from './components/Titlebar/Titlebar';
import { isCompositeComponent } from 'react-dom/test-utils';

console.log("SUBGRAPH URL IS",process.env.REACT_APP_SUBGRAPH_URL);

const client = new ApolloClient({
  uri: process.env.REACT_APP_SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

const tokenQuery = gql`
{ tokens { contract tokenID owner tokenURI } }
`;

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

function getLibrary(provider: ExternalProvider | JsonRpcFetchFunc) {
  const library = new Web3Provider(provider);
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

  const { library } = useWeb3React();

  const { data, loading, error } = useQuery(nftByPopularity);

  function fake() {
    const product = {
      account: faker.finance.ethereumAddress(),
      name: faker.commerce.product(),
      price: faker.commerce.price(),
      img: faker.image.image()
    }
    console.log(product)
    return product
  }

  function bid() {
    console.log("bid");
    console.log(library)
    appendDB()
  }
  
  function accept() {
    console.log("accept");
    console.log(library);
  }

  async function instantiateDB() {
    let result;
    let bidObjStr = '{"bids":[]}';
    let bidObj = JSON.parse(bidObjStr);
    bidObj['bids'].push(fake());
    
    const input = {
      apiKey: process.env.REACT_APP_FLEEK_API_KEY,
      apiSecret: process.env.REACT_APP_FLEEK_API_SECRET,
      key: '0.json',
      data: JSON.stringify(bidObj)
    };
    return result = await fleek.upload(input);
  }

  async function getDB() {
    const DB = await fleek.get({
      apiKey: process.env.REACT_APP_FLEEK_API_KEY,
      apiSecret: process.env.REACT_APP_FLEEK_API_SECRET,
      key: '0.json',
      getOptions: [
        'data',
        //'bucket',
        //'key',
        //'hash',
        'publicUrl'
      ],
    })
    return JSON.parse(DB.data);
  }

  async function appendDB() {
    let result
    let bidObj = await getDB()

    bidObj['bids'].push(fake());

    const input = {
      apiKey: process.env.REACT_APP_FLEEK_API_KEY,
      apiSecret: process.env.REACT_APP_FLEEK_API_SECRET,
      key: '0.json',
      data: JSON.stringify(bidObj)
    };
    return result = await fleek.upload(input);
  }
  
  setTimeout(() => {
    console.table("THE GRAPH:",data)
    console.log("DB:",getDB())
  },1000)
 
  return (
    <div className="app">
    	<Titlebar />
      <div className="body">
        <div className="testainer">
      	  { loading && <p>Still loading..</p>}
       	  { error && <p>Error Retrieving Data!</p>}
       	  { data && <p>Data Retrieved</p>}
        </div>
        <div className="nft_container">
          <img src={nft} className="nft_img" alt="ntf" />
          <div className="nft_bid_accept">
            <button
              className="bid_btn nft-btn"
              onClick={bid}
            >
            	Bid
            </button>
            <button
              className="accept_btn nft-btn"
              onClick={accept}
            >
            	Accept
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function wrappedApp() {
  return (
    <ApolloProvider client={client}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <App />
      </Web3ReactProvider>
    </ApolloProvider>
  );
}

const mapDispatchToProps = (dispatch: (arg0: { type: string; payload: any; }) => any) => ({
  setExValue: (exValue: any) => dispatch(setExValue(exValue))
})

export default connect(null,mapDispatchToProps)(wrappedApp);