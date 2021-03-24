import React from 'react';
import ConnectBtn from '../../components/ConnectBtn/ConnectBtn.jsx';
import './Titlebar.css';
import logo from '../../logo.png';


const Titlebar = () =>
  <header id="header">
    <img src={logo} className="logo" />
    <div className="header-right">
    	<ConnectBtn />
    </div>
  </header>

export default Titlebar
