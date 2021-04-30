import React, { useContext, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Animated } from "react-animated-css";
import * as ethers from 'ethers';
import axios from 'axios';

import './CreateView.css';

import { UserContext } from '../../contexts/userContext';

const CreateView = (props) => {
  // web3react
  const { account, library } = useWeb3React();
  // user Context
  const [ state ] = useContext(UserContext);
  // form validation
  const [ validated, setValidated ] = useState(true);
  // contract address and token id of auction nft
  const [ contractAddress, setContractAddress ] = useState(null);
  const [ tokenId, setTokenId ] = useState(null);

 /*
  const nftcontractaddress = "0x101eD6EeC2CB7813a04614cA97421119219AfC1a";
  const nfttokenid = "0x0";
  const bidderaddress = state.user;
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
      bidder: state.user,
      amount: amt,
      contractaddress: nftcontractaddress,
      tokenid: nfttokenid
    };
    console.log(newbid);
    //appendDB(newbid);
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
*/

  function createAuction() {
    console.log("Sending auction to DB")
    //axios.post('http://localhost:5000/api/fleek/createAuction', {
    axios.post('https://zproxy.ilios.dev/api/fleek/createAuction', {
      account: state.user,
      tokenId: tokenId,
      contractAddress: contractAddress,
      startTime: "0",
      endTime: "0",
      minBid: "0.1",
      auctionType: "0" 
    })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  function createClick(e) {
    e.preventDefault();
    var t = Math.floor(new Date().getTime() / 1000);
    if (ethers.utils.isAddress(contractAddress) && tokenId ) {
      setValidated(true)
      console.log("time",t,"account",state.user,"contract address",contractAddress,"token id",tokenId);
      createAuction();
      
    } else {
      setValidated(false)
    }
  }
  
  return (
    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
      <div className="create-view">
        <h1 className="title">Auction your NFT</h1><div>
            {
      				!state.user
      				? (
                <h3>Not Connected</h3>
      				)
      				: (
                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                  <form className="create-form">
                    <h3 className="tshadow">Contract Address</h3>
                    <input 
                      className="zinput"
                      type="string"
                      onChange={e => {
                        setContractAddress(e.target.value)
                      }}
                      
                    />
                    <h3 className="tshadow">Token Id</h3>
                    <input 
                      className="zinput"
                      type="string"
                      onChange={e => {
                        setTokenId(e.target.value);
                      }}
                    />
                    <button
                      className="create-btn"
                      onClick={createClick}
                    >
                      Accept
                    </button>

                    {
                      !validated && <p className="form-validation">Please provide a valid Address and Token Id</p>
                    }

                  </form>
                </Animated>
      				)
      			}
  
          </div>
        
      </div>
    </Animated>
  )
}
export default CreateView;