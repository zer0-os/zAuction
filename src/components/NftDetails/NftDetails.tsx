import React, { useContext, useEffect, useState } from 'react';
import './NftDetails.css';
//import {AuctionContext} from '../../contexts/auctionContext';
//import Nft from '../Nft/Nft';


const NftDetails = (props) => {
  //const { bids } = useContext(AuctionContext);
  const [nftId, setNftid] = useState("poo");

  //useEffect(() =>{
  //  if (bids.length) {
  //    let newBids = [...lbids];
  //    newBids = newBids.concat(bids);
  //    setLbids(newBids);
  //  }
  //}, [bids])

  return nftId ? (
    <div>
      <h1 className="title">Auction Details</h1>
      <div className="details-view">
        <h1>{props.match.params.nftId}</h1>
      </div>
    </div>
  ) : (
    <div className="text-center mt-5">
        <h1 className="title">Auction Details</h1>
        <h1 style={{color:"white"}}>Invalid Auction</h1>
    </div>
  )

}

export default NftDetails;