import React, { useContext } from 'react';

import { UserContext } from '../../contexts/userContext';

const ProfileView = () => {
    const user = useContext(UserContext);
    return (
      <div className="profile-view">
        <h1 className="title">Your Auctions</h1>
        <div>
          {
    				user
    				? (
              <p>Not Connected</p>
    				)
    				: (
              <div 
                className="testBox"
                style={{width:"100%",display:"block",flexDirection:"row"}}
              >
                <button
                  onClick={() => {console.log("Deposit")}}
                  className="z-btn"
                > Deposit </button>
                <button
                  onClick={() => {console.log("Approve")}}
                  className="z-btn"
                > Approve </button>
              </div>
    				)
    			}
  
        </div>
      </div>
      );
}
export default ProfileView;