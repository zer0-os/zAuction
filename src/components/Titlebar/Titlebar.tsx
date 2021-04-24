import React from 'react';
import { connect } from 'react-redux';
import ConnectBtn from '../ConnectBtn/ConnectBtn';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';

import './Titlebar.css';
import logo from '../../logo.png';
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from 'constants';

const Titlebar = (props: any) => (

  <header id="header">
    <Link to="/" title="View Auctions">
      <img src={logo} className="logo" alt="logo" />
    </Link>
    <div className="header-right">
      <Link to="/" title="View Auctions">
        <div className="nft-nav">
          <svg className="nft-nav" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="white">
            <path d="M485.5 0L576 160H474.9L405.7 0h79.8zm-128 0l69.2 160H149.3L218.5 0h139zm-267 0h79.8l-69.2 160H0L90.5 0zM0 192h100.7l123 251.7c1.5 3.1-2.7 5.9-5 3.3L0 192zm148.2 0h279.6l-137 318.2c-1 2.4-4.5 2.4-5.5 0L148.2 192zm204.1 251.7l123-251.7H576L357.3 446.9c-2.3 2.7-6.5-.1-5-3.2z"></path>
          </svg>
        </div>
      </Link>
      <Link to="/create" title="New Auction">
        <div className="create-nav">
          <svg className="create-nav" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="white">
            <path d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm144 276c0 6.6-5.4 12-12 12h-92v92c0 6.6-5.4 12-12 12h-56c-6.6 0-12-5.4-12-12v-92h-92c-6.6 0-12-5.4-12-12v-56c0-6.6 5.4-12 12-12h92v-92c0-6.6 5.4-12 12-12h56c6.6 0 12 5.4 12 12v92h92c6.6 0 12 5.4 12 12v56z"></path>
          </svg>
        </div>
      </Link>
      <Link to="/profile" title="My Auctions">
        <div className="profile-nav">
          <svg className="profile-nav" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        </div>
      </Link>
    	<ConnectBtn />
    </div>
  </header>
)

const mapStateToProps = (state: { exReducer: { exValue: any; }; }) => ({
  exValue: state.exReducer.exValue
})

export default connect(mapStateToProps)(Titlebar);