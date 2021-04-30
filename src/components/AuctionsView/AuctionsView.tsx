import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Animated } from "react-animated-css";
import './AuctionsView.css';
import { AuctionContext } from '../../contexts/auctionContext';
import { UserContext } from '../../contexts/userContext';
import Auction from '../Auction/Auction';
import Loader from "react-loader-spinner";
//import { unstable_renderSubtreeIntoContainer } from 'react-dom';

const AuctionsView = () => {
  const { auctionsState, auctionsDispatch } = useContext(AuctionContext);
  const { auctions } = auctionsState;
  const [ state ] = useContext(UserContext);
  const { user } = state;

  // run on component first mount
  useEffect(() => {
    updateAuctions()
    console.log("AuctionsView loaded, fetched the following auctions:",auctions)
  },[]);

  // run on auctions update
  //useEffect(() =>{
  //  console.log("Auctions update", auctionsState.auctions)
  //}, [auctionsState.auctions])

  function updateAuctions() {
    auctionsDispatch({ type: "UPDATE_AUCTIONS" });
  }
  
  return ( 
    <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
      <h1 className="title">Auctions</h1>
    {
      user
      ? (
       <>
        {
          auctions
          ? (
            <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
              <div className="auctions-view">
                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                  <ul>
                    {auctions.map(auction => 
                      <Auction auctionId={auction} key={auction} />
                    )}
                  </ul>
                </Animated>
              </div>
                  <Link to="/">
                    <div className="refresh-auctions">
                      <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sync-alt" className="svg-inline--fa fa-sync-alt fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path fill="white" d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"></path>
                      </svg>
                    </div>
                  </Link>
            </Animated>
          )
          : (
            <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
              <Loader
                type="BallTriangle"
                color="#a1d2ff"
                height={100}
                width={100}
                className="glow2"
              />
              <h2 className="glow">Loading...</h2>

              
            </Animated>
          )
        }
        </>
      )
      : (
        <h3>Not Connected</h3>
      )
    }
    </Animated>
  )

}

export default AuctionsView;