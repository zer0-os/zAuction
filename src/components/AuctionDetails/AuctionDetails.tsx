import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Animated } from "react-animated-css";
import axios from 'axios';
import Geopattern from 'geopattern';
import './AuctionDetails.css';
import { useWeb3React } from '@web3-react/core';
import { erc721abi } from '../../erc721abi';
import * as ethers from 'ethers';
import logo from '../../assets/imgs/logo.png';
//import {AuctionContext} from '../../contexts/auctionContext';


const AuctionDetails = (props: { match: { params: { auctionId: any; }; }; }) => {
  //const { bids } = useContext(AuctionContext);
	const { account, library, chainId } = useWeb3React()
  const [ auctionId ] = useState(props.match.params.auctionId);
  const [ loading, setLoading ] = useState(true);
  const [ auction, setAuction ] = useState();
  const [ bidAmt, setBidAmt ] = useState(0);
  const [ img, setImg ] = useState();

  // on component render
  useEffect(() =>{
    setImg(Geopattern.generate(auctionId).toDataUri())
    getAuction(auctionId);
  }, [])

  useEffect(() =>{
    if(auction){
      processAuction(auction);
      //console.log(auction);
      //const {contractAddress, tokenId} = auction;
    }
  }, [auction])

  async function processAuction(auction) {
    //console.log(auction);
    try{
    //console.log(library)
    let contract = new ethers.Contract(auction.contractAddress, erc721abi, library);
    //console.log(erc721abi);
    //console.log(contract);
    let uri = await contract.functions.tokenURI(auction.tokenId);
    //console.log(uri);
    // pull the img
    axios.get(uri[0],
      //{ 
      //headers: {'Content-Type':'application/json'},
      //  params: {key:auctionId},
      //responseType: 'arraybuffer'
      //}
    )
      .then(function (response) {
        //let imgBuffer = Buffer.from(response.data, 'binary').toString('base64')
        console.log("Got image", response.data.image);
        
        // fetch the img
        try {
          axios.get(response.data.image, 
            {
              headers: {'Content-Type':'image/jpeg'},
              responseType: 'arrayBuffer'
            }
          )
            .then((response) => {
              console.log(response)
            })
            .catch((err) => {console.log(err)})

        } catch (e) {console.log(e)}
        
      })
      .catch(function (error) {
        console.log(error);
      });
    }
    catch(e){console.log(e)}
  }

  async function getAuction(auctionId) {
    //axios.get('http://localhost:5000/api/fleek/getAuction',
    axios.get('https://zproxy.ilios.dev/api/fleek/getAuction',
      { headers: {'Content-Type':'application/json'},
        params: {key:auctionId},
      }
    )
      .then(function (response) {
        console.log("Auction data",response);
        setAuction(response.data);
        setLoading(false);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  async function postBid(bidAmt, e) {
    e.preventDefault();
    let bidMsg = await library.getSigner().signMessage(ethers.utils.toUtf8Bytes(bidAmt + auction.contractAddress + auction.tokenId));
    //let newbid = {
    //  msg: bidmsg,
    //  bidder: account,
    //  amount: bidAmt,
    //  contractaddress: auction.contractAddress,
    //  tokenid: auction.tokenId
    //};
    console.table("Posting bid");
    //axios.post('http://localhost:5000/api/fleek/bid', {
    axios.post('https://zproxy.ilios.dev/api/fleek/bid', {
      key: auctionId,
      account: account,
      bidAmt: bidAmt,
      bidMsg: bidMsg
    })
    .then(function (response) {
      console.log(response);
    })
    .catch(function (error) {
      console.log(error);
    });
  }

  return auctionId ? (
    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
      <h1 className="title">Auction Details</h1>
      {
        !loading
        ? (
        <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
          <div className="details-view">
            {
              img
              ? (
                <img src={img} className="auction-img" />
              )
              : (
                <img src={logo}className="auction-img" />
              )
            }
            <h3 className="subtitle">Auction account: <span className="subtext">{auction.account}</span></h3>
            <h3 className="subtitle">Contract Address: <span className="subtext">{auction.contractAddress}</span></h3>
            <h3 className="subtitle">Token Id: <span className="subtext">{auction.tokenId}</span></h3>
            <h3 className="subtitle">Current Bid Amount: <span className="subtext">{auction.currentBid}</span></h3>
            <h3 className="subtitle">Current Bidder: <span className="subtext">{auction.currentBidder}</span></h3>
            {
              account == auction.account
              ? (
                <>
                <button
                  className="accept-btn"
                  onClick={(e) => {console.log("yee")}}
                >
                  Accept Bid
                </button>
                </>
              )
              : (
                <form className="bid_form">
                  <input 
                    className="bid_input" 
                    type="number"
                    step="0.1"
                    min={auction.minBid}
                    value={bidAmt}
                    onChange={(e) => {
                      setBidAmt(parseFloat(e.target.value))
                    }}
                  />
                  <button
                    className="bid_btn nft-btn"
                    onClick={(e) => {postBid(bidAmt,e)}}
                  >
                    Bid
                  </button>
                </form>
              )
            }
          </div>
        </Animated>
        )
        : (
          <div className="details-view">
            <Loader
              type="BallTriangle"
              color="#a1d2ff"
              height={100}
              width={100}
              className="glow2"
            />
            <h2 className="glow">Loading...</h2>
          </div>
        )
      }

    </Animated>
  ) : (
    <div className="text-center mt-5">
        <h1 className="title">Auction Details</h1>
        <h1 style={{color:"white"}}>Invalid Auction</h1>
    </div>
  )

}

export default AuctionDetails;