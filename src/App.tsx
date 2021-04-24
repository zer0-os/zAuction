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

// fleek
import fleek from '@fleekhq/fleek-storage-js';

// imports
import './App.css';
import Titlebar from './components/Titlebar/Titlebar';
import NftView from './components/NftView/NftView';
import Nft from './components/Nft/Nft';
import NftView2 from './components/NftView2/NftView2';
import ProfileView from './components/ProfileView/ProfileView';
import CreateView from './components/CreateView/CreateView';
import NftDetails from './components/NftDetails/NftDetails';


// GQL query code
//
// //console.log("SUBGRAPH URL IS",process.env.REACT_APP_SUBGRAPH_URL);
 const client = new ApolloClient({
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
  console.log(useWeb3React());
  const { data, loading, error } = useQuery(nftByPopularity);

  const nftcontractaddress = "0x101eD6EeC2CB7813a04614cA97421119219AfC1a";
  const nfttokenid = "0x0";
  const bidderaddress = account;
  const amt = 1000;
  let bidAmt: number;

  async function bid(amt,e) {
    e.preventDefault()
    console.log("bid",amt);
    console.log(library);
    console.log(account);
    //let bidmsg = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(amt + account + nftcontractaddress + nfttokenid));
    let bidmsg = await library.getSigner().signMessage(ethers.utils.toUtf8Bytes(amt + nftcontractaddress + nfttokenid));
    let newbid = {
      msg: bidmsg,
      bidder: account,
      amount: amt,
      contractaddress: nftcontractaddress,
      tokenid: nfttokenid
    };
    console.log(newbid);
    appendDB(newbid);
  }
  
  async function accept() {
    const db = await getDB();

    console.log(db);
    let contractaddress = "0x3512413A8f4d0911C7B7E5B6c4326124a55801B2"; 
    let abi = [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "accountantaddress",
            "type": "address"
          }
        ],
        "name": "init",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "bidder",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "bid",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "nftaddress",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokenid",
            "type": "uint256"
          }
        ],
        "name": "acceptBid",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes",
            "name": "signature",
            "type": "bytes"
          }
        ],
        "name": "recover",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "pure",
        "type": "function",
        "constant": true
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "hash",
            "type": "bytes32"
          }
        ],
        "name": "toEthSignedMessageHash",
        "outputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "stateMutability": "pure",
        "type": "function",
        "constant": true
      }
    ]
    let contract = new ethers.Contract(contractaddress, abi, library.getSigner());
    console.log(contract);
    contract.acceptBid(
      db.bids[db.bids.length-1].msg, 
      db.bids[db.bids.length-1].bidder,
      ethers.utils.parseEther(db.bids[db.bids.length-1].amount.toString()), 
      db.bids[db.bids.length-1].contractaddress, 
      db.bids[db.bids.length-1].tokenid
    );
  }

  /*async function instantiateDB() {
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
  }*/

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

  async function appendDB(newbid) {
    let result
    let bidObj = await getDB()

    bidObj['bids'].push(newbid);

    const input = {
      apiKey: process.env.REACT_APP_FLEEK_API_KEY,
      apiSecret: process.env.REACT_APP_FLEEK_API_SECRET,
      key: '0.json',
      data: JSON.stringify(bidObj)
    };
    return result = await fleek.upload(input);
  }
  
  async function fleekWriteFile(apiKey, apiSecret, key, data) {
    let result;
  	const input = {
  		apiKey: apiKey,
  		apiSecret: apiSecret,
  		key: key,
  		data: JSON.stringify(data)
  	};
  }

  return (
    <div className="app">
    	<Titlebar />
      <div className="body">
        <Switch>
          <Route 
            path="/"
            exact
            component={NftView2}
          />
          <Route path="/profile" component={ProfileView}/>
          <Route path="/create" component={CreateView}/>
          <Route path="/nftDetails/:nftId" component={NftDetails}/>
        </Switch>

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