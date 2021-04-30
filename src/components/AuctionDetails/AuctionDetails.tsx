import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import axios from 'axios';
import './AuctionDetails.css';
import { useWeb3React } from '@web3-react/core';
//import {AuctionContext} from '../../contexts/auctionContext';


const AuctionDetails = (props: { match: { params: { auctionId: any; }; }; }) => {
  //const { bids } = useContext(AuctionContext);
	const { account, library, chainId } = useWeb3React()
  const [ auctionId ] = useState(props.match.params.auctionId);
  const [ loading, setLoading ] = useState(true);
  const [ auction, setAuction ] = useState();

  // on component render
  useEffect(() =>{
    getAuction(auctionId);
    processAuctions();
  }, [])

  async function processAuctions() {
    console.log(library)
  }

  async function getAuction(auctionId) {
    //axios.get('http://localhost:5000/api/fleek/getAuction',
    axios.get('https://zproxy.ilios.dev/api/fleek/getAuction',
      { headers: {'Content-Type':'application/json'},
        params: {key:auctionId},
      }
    )
      .then(function (response) {
        console.log(response);
        setAuction(response.data);
        setLoading(false);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  return auctionId ? (
    <div>
      <h1 className="title">Auction Details</h1>
      {
        !loading
        ? (
      <div className="details-view">
        <p>Auction account: {auction.account}</p>
        <p>Token Id: {auction.tokenId}</p>
        <p>Auction Type: {auction.auctionType}</p>
        <p>Contract Address: {auction.contractAddress}</p>
        <p>Start Time: {auction.startTime}</p>
        <p>End Time: {auction.endTime}</p>
        <p>Minimum Bid: {auction.minBid}</p>

          </div>
        )
        : (
          <div>
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

    </div>
  ) : (
    <div className="text-center mt-5">
        <h1 className="title">Auction Details</h1>
        <h1 style={{color:"white"}}>Invalid Auction</h1>
    </div>
  )

}

export default AuctionDetails;