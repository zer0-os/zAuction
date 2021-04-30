import React, { useContext, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Animated } from "react-animated-css";
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
    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
      <h1 className="title">Auction Details</h1>
      {
        !loading
        ? (
        <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
          <div className="details-view">
            <h3>Auction account: <span className="subtext">{auction.account}</span></h3>
            <h3>Token Id: <span className="subtext">{auction.tokenId}</span></h3>
            <h3>Auction Type: <span className="subtext">{auction.auctionType}</span></h3>
            <h3>Contract Address: <span className="subtext">{auction.contractAddress}</span></h3>
            <h3>Start Time: <span className="subtext">{auction.startTime}</span></h3>
            <h3>End Time: <span className="subtext">{auction.endTime}</span></h3>
            <h3>Minimum Bid: <span className="subtext">{auction.minBid}</span></h3>
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