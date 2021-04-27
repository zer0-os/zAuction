import React, { useContext, useEffect, useState } from 'react';
import './AuctionDetails.css';
//import {AuctionContext} from '../../contexts/auctionContext';


const AuctionDetails = (props: { match: { params: { auctionId: any; }; }; }) => {
  //const { bids } = useContext(AuctionContext);
  const [auctionId, setAuctionId] = useState(props.match.params.auctionId);

  //useEffect(() =>{
  //  if (bids.length) {
  //    let newBids = [...lbids];
  //    newBids = newBids.concat(bids);
  //    setLbids(newBids);
  //  }
  //}, [bids])

  return auctionId ? (
    <div>
      <h1 className="title">Auction Details</h1>
      <div className="details-view">
        <h1>{auctionId}</h1>
      </div>
    </div>
  ) : (
    <div className="text-center mt-5">
        <h1 className="title">Auction Details</h1>
        <h1 style={{color:"white"}}>Invalid Auction</h1>
    </div>
  )

}

export default AuctionDetails;