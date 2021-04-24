import React, { useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import * as ethers from 'ethers';
import fleek from '@fleekhq/fleek-storage-js';

import nft from '../../nft.png';

const CreateView = (props) => {
  const { account, library } = useWeb3React();

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
  
  return (
    <div className="create-view">
      <h1 className="title">Auction your NFT</h1>
      
      <div className="nft_container" style={{display:"block"}}>
        <img src={nft} className="nft_img" alt="nft" />
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
    </div>
  );
}
export default CreateView;