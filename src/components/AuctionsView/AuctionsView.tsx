import React, { useContext, useEffect, useState } from 'react';
import './AuctionsView.css';
import { AuctionContext } from '../../contexts/auctionContext';
import { UserContext } from '../../contexts/userContext';
import Auction from '../Auction/Auction';
import Loader from "react-loader-spinner";
//import { unstable_renderSubtreeIntoContainer } from 'react-dom';

const AuctionsView = () => {
  const [ state, dispatch ] = useContext(AuctionContext);
  const { auctions } = state;

  // run on component first mount
  useEffect(() => {
    updateAuctions()
    console.log("AuctionsView loaded, fetched the following auctions:",auctions)
  },[]);

  // run on auctions update
  useEffect(() =>{
    console.log("Auctions update", state.auctions)
  }, [state.auctions])

  function updateAuctions() {
    dispatch({ type: "UPDATE_AUCTIONS" });
  }
  
  return ( 
    <div>
    {
      auctions
      ? (
        <div>
          <h1 className="title">Auctions</h1>
          <div className="auctions-view">
              <ul>
                {auctions.map(auction => 
                  <Auction auctionId={auction} key={auction} />
                )}
              </ul>
          </div>
        </div>
      )
      : (
        <div>
          <h1 className="title">Auctions</h1>
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
  )

}

export default AuctionsView;