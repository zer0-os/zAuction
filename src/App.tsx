import React from 'react';
import { connect } from 'react-redux';
import fleek from '@fleekhq/fleek-storage-js';
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
import { ApolloClient, ApolloProvider, InMemoryCache, useQuery, gql } from '@apollo/client';
import faker from 'faker';
//import contract from './utils/instantiate-contract';
//require('zAuction.json');

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
import NftView from './components/NftView/NftView';
import Nft from './components/Nft/Nft';
//import { isCompositeComponent } from 'react-dom/test-utils';

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
let bidAmt: number;

function App() {
  const { connector, account, library } = useWeb3React();
  console.log(useWeb3React());
  const { data, loading, error } = useQuery(nftByPopularity);

  const nftcontractaddress = "0x101eD6EeC2CB7813a04614cA97421119219AfC1a";
  const nfttokenid = "0x0";
  const bidderaddress = account;
  const amt = 1000;

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
      db.bids[db.bids.length-1].tokenid);
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
  
  //setTimeout(() => {
  //  console.table("THE GRAPH:",data)
  //  console.log("DB:",getDB())
  //},1000)
  
  //let DB = getDB();
  //let eDB = {"bids":[]}
  let DB = {"bids":[{"account":"0xc8289f53c49dc9dfc040c4b25e391547dee25e6b","name":"Pizza","price":"216.00","img":"http://placeimg.com/640/480/nature"},{"account":"0xa9b0703d1debd7d8c251f597af5fb0fe518e5ad9","name":"Hat","price":"559.00","img":"http://placeimg.com/640/480/business"},{"account":"0x39ec1855c69e77fd549ffc7a89d8dc63b4b886db","name":"Pizza","price":"277.00","img":"http://placeimg.com/640/480/fashion"},{"account":"0x3175cb28db86e64b3d7fd1daa1e6b2ce65eaa79c","name":"Chair","price":"706.00","img":"http://placeimg.com/640/480/city"},{"account":"0xbfefc62ebcbc0e3cdcdd9d20389dc20d3645fa90","name":"Shoes","price":"871.00","img":"http://placeimg.com/640/480/people"},{"account":"0xb1d12d3e7fe9c9919f92a317e3b49efafa954eee","name":"Shirt","price":"821.00","img":"http://placeimg.com/640/480/fashion"},{"account":"0xcbfefd2bdf472bf392d4bfcfa4cd7fdeefd84fea","name":"Cheese","price":"821.00","img":"http://placeimg.com/640/480/business"},{"account":"0xebb7f5dc95b2b0fea4ea4a3fc697f12f268796e7","name":"Shoes","price":"355.00","img":"http://placeimg.com/640/480/food"},{"account":"0xdab762c9a3f5d10b1437fff4b24edffedd029acc","name":"Soap","price":"831.00","img":"http://placeimg.com/640/480/nightlife"},{"account":"0x6ff319e74c666d2d9af32ac12fe8ee97cc37759e","name":"Table","price":"198.00","img":"http://placeimg.com/640/480/food"},{"account":"0xd0bfa19a98b7db48db7acd1b50eadb50eacbb7ce","name":"Pizza","price":"364.00","img":"http://placeimg.com/640/480/cats"},{"account":"0xeed8fbf0dce7ed1e3b4d5e5de7fcbea1cfac9cf4","name":"Car","price":"946.00","img":"http://placeimg.com/640/480/nightlife"},{"account":"0xaac7a85400ff19c76d40d8b9cd1e770fb58682ba","name":"Soap","price":"420.00","img":"http://placeimg.com/640/480/fashion"}]}
  //let eDB = {"bids":[{"account":"0xc8289f53c49dc9dfc040c4b25e391547dee25e6b","name":"Pizza","price":"216.00","img":"http://placeimg.com/640/480/nature"}]}
  let profilePopoverHidden = false

  return (
    <div className="app">
    	<Titlebar />
      <div className="body">
        {!profilePopoverHidden &&
          <div className="profile-popover" data-boundry="viewport">
            <div className="profile-popover-body">
              <div className="profile-popover-top">
                <span className="profile-popover-title">Profile</span>
                <div className="profile-popover-x" onClick={() => {
                  console.log(profilePopoverHidden)
                  profilePopoverHidden = true
                  console.log(profilePopoverHidden)
                  }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white">
                    <path fillRule={"evenodd"} d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule={"evenodd"} />
                  </svg>
                </div>
              </div>
              <hr className="profile-popover-hr" />
              <div className="profile-popover-bottom"></div>
            </div>
          </div>
        }

        <div className="testainer" style={{display:"none"}}>
      	  { loading && <p>Still loading..</p>}
       	  { error && <p>Error Retrieving Data!</p>}
       	  { data && <p>Data Retrieved</p>}
        </div>
        
        <div className="nft_container" style={{display:"block"}}>
          <img src={nft} className="nft_img" alt="ntf" />
          <div className="nft_bid_accept">
            <form className="bid_form">
              <input 
                className="bid_input" 
                type="number" 
                value={bidAmt}
                onChange={(e) => {
                  bidAmt = parseInt(e.target.value)
                }}
              />       
              <button
                className="bid_btn nft-btn"
                onClick={(e) => bid(bidAmt,e)}
              >
                Bid
              </button>
            </form>
            <div>
              <button
                className="accept_btn nft-btn"
                onClick={accept}
              >
                Accept
              </button>
            </div>

          </div>
        </div>

        <div 
          className="testBox"
          style={{width:"100%",display:"flex",flexDirection:"row"}}
        >
          <button
            onClick={() => {console.log("Deposit")}}
            className="z-btn"
          > Deposit </button>
          <button
            onClick={() => {console.log("Approve")}}
            className="z-btn"
          > Approve </button>
        </div>
        
        <NftView db={DB}/>
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