import React, { useContext, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import * as ethers from 'ethers';
import fleek from '@fleekhq/fleek-storage-js';

import './CreateView.css';

import nft from '../../nft.png';

const CreateView = (props) => {
  const { account, library } = useWeb3React();
  // contract address and token id of auction nft
  const [ CA, setCA ] = useState(null);
  const [ TI, setTI ] = useState(null);

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
    //const db = await getDB();
    const db = [];

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

  function createClick(e) {
    e.preventDefault();
    var t = Math.floor(new Date().getTime() / 1000);
    console.log(t + '-' + account);
  }
  
  return (
    <div className="create-view">
      <h1 className="title">Auction your NFT</h1>
      
      <form className="create-form">
        <h3 className="tshadow">Contract Address</h3>
        <input 
          className="zinput"
          type="string"
          onChange={e => {
            setCA(e.target.value)
          }}
          
        />
        <h3 className="tshadow">Token Id</h3>
        <input 
          className="zinput"
          type="string"
          onChange={e => {
            setTI(e.target.value);
          }}
        />
        <button
          className="create-btn"
          onClick={createClick}
        >
          Accept
        </button>
      </form>
      
    </div>
  )
}
export default CreateView;