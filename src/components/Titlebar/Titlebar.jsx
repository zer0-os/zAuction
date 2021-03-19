import React from 'react';
import './Titlebar.css';
import logo from '../../logo.png';

const Titlebar = () =>
  <header id="header">
    <img src={logo} className="logo" />
    <div className="header-right"></div>
  </header>

export default Titlebar
