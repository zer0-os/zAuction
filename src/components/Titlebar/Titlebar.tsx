import React from 'react';
import { connect } from 'react-redux';
import ConnectBtn from '../ConnectBtn/ConnectBtn';
import './Titlebar.css';
import logo from '../../logo.png';


const Titlebar = (props: { exValue: React.ReactNode; }) => (

  <header id="header">
    <img src={logo} className="logo" alt="logo" />
    <div className="header-right">
      <span style={{color:"red",paddingRight:"1.5em",display:"none"}}>
        {props.exValue}
      </span>
      <div className="profile-avatar"
        onClick={() => {console.log("When the world needed the avatar the most, he vanished...")}}
      >
        <svg className="profile-avatar" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      </div>
    	<ConnectBtn />
    </div>
  </header>
)

const mapStateToProps = (state: { exReducer: { exValue: any; }; }) => ({
  exValue: state.exReducer.exValue
})

export default connect(mapStateToProps)(Titlebar);