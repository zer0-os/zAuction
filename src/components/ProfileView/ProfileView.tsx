import React, { useContext, useEffect, useState } from 'react';
import { Animated } from "react-animated-css";
import { Link } from 'react-router-dom';
import Auction from '../Auction/Auction';
import Loader from "react-loader-spinner";
import { AuctionContext } from '../../contexts/auctionContext';

import './ProfileView.css';

import { UserContext } from '../../contexts/userContext';

const ProfileView = () => {
    const [state, dispatch] = useContext(UserContext);
    const { auctionsState, auctionsDispatch } = useContext(AuctionContext);
    const { auctions } = auctionsState;
    const [ userAuctions, setUserAuctions ] = useState([]);
    
    // run on component first mount
    useEffect(() => {
      updateAuctions()
      if (auctions.length) {
        console.log("ProfileView loaded, fetched the following auctions:",auctions)
        var filtAuctions =  auctions.filter(checkUser);
        console.log("Filtered Auctions",filtAuctions);
        setUserAuctions(filtAuctions);
      }
    },[]);

    // run on auctions update
    useEffect(() => {
      console.log("Auctions changed",auctions)
      console.log(auctions.filter(checkUser));
    },[auctions]);

    function updateAuctions() {
      auctionsDispatch({ type: "UPDATE_AUCTIONS" });
    }

    function checkUser(auction) {
      return state.user == auction.substring(10)
    }

    return (
      <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
        <div className="profile-view">
          <h1 className="title">Profile</h1>
          
          <div>
            {
    		  		!state.user
    		  		? (
                <h3>Not Connected</h3>
    		  		)
    		  		: (
                <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                  <div 
                    className="testBox"
                    style={{width:"100%",display:"block",flexDirection:"row"}}
                  >
                    <h3>Account: <span className="subtext">{ state.user }</span></h3>
                    <h2 className="title">Your Auctions</h2>
                    {
                      userAuctions.length
                      ? (
                        <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                          <div className="auctions-view">
                            {userAuctions.map(auction => 
                              <Auction auctionId={auction} key={auction} />
                            )}
                          </div>
                        </Animated>
                      )
                      : (
                        <Animated animationIn="fadeIn" animationOut="fadeOut" isVisible={true}>
                          <Link to="/profile">
                            <div className="refresh-auctions">
                              <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="sync-alt" className="svg-inline--fa fa-sync-alt fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                <path fill="white" d="M370.72 133.28C339.458 104.008 298.888 87.962 255.848 88c-77.458.068-144.328 53.178-162.791 126.85-1.344 5.363-6.122 9.15-11.651 9.15H24.103c-7.498 0-13.194-6.807-11.807-14.176C33.933 94.924 134.813 8 256 8c66.448 0 126.791 26.136 171.315 68.685L463.03 40.97C478.149 25.851 504 36.559 504 57.941V192c0 13.255-10.745 24-24 24H345.941c-21.382 0-32.09-25.851-16.971-40.971l41.75-41.749zM32 296h134.059c21.382 0 32.09 25.851 16.971 40.971l-41.75 41.75c31.262 29.273 71.835 45.319 114.876 45.28 77.418-.07 144.315-53.144 162.787-126.849 1.344-5.363 6.122-9.15 11.651-9.15h57.304c7.498 0 13.194 6.807 11.807 14.176C478.067 417.076 377.187 504 256 504c-66.448 0-126.791-26.136-171.315-68.685L48.97 471.03C33.851 486.149 8 475.441 8 454.059V320c0-13.255 10.745-24 24-24z"></path>
                              </svg>
                            </div>
                          </Link>
                        </Animated>
                      )
                    }
                  </div>
                </Animated>
    		  		)
    		  	}
  
          </div>
        </div>
      </Animated>
      );
}
export default ProfileView;