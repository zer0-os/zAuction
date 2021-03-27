import React from 'react';
import ConnectBtn from '../ConnectBtn/ConnectBtn';
import './Titlebar.css';
import logo from '../../logo.png';


const Titlebar = () =>
  <header id="header">
    <img src={logo} className="logo" alt="logo" />
    <div className="header-right">
    	<ConnectBtn />
    </div>
  </header>

export default Titlebar
