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
    	<ConnectBtn />
    </div>
  </header>
)

const mapStateToProps = (state: { exReducer: { exValue: any; }; }) => ({
  exValue: state.exReducer.exValue
})

export default connect(mapStateToProps)(Titlebar);