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
              <h3>Account: <span className="subtext">{ state.user }</span></h3>
              <h2 className="title">Your Auctions</h2>

              </div>
    				)
    			}
  
        </div>
      </div>
      );
}
export default ProfileView;