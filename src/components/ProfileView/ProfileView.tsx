import React, { useContext } from 'react';

import './ProfileView.css';

import { UserContext } from '../../contexts/userContext';

const ProfileView = () => {
    const [state, dispatch] = useContext(UserContext);
    
    return (
      <div className="profile-view">
        <h1 className="title">Profile</h1>
        
        <div>
          {
    				!state.user
    				? (
              <h3>Not Connected</h3>
    				)
    				: (
              <div 
                className="testBox"
                style={{width:"100%",display:"block",flexDirection:"row"}}
              >
              <h2 className="title" style={{margin:"24px 0 10px"}}>Account</h2>
              <h4 className="tshadow eth-account" style={{margin:"0 0 36px 0"}}>{ state.user }</h4>
              <h2 className="title">Your Auctions</h2>

              </div>
    				)
    			}
  
        </div>
      </div>
      );
}
export default ProfileView;