import React from 'react';
import { connect } from 'react-redux';
import './Nft.css';

const Nft = (props) => (
  <div className="nft">
    <img src={props.img} className="nft-img" alt="nft" />
    <h3 className="nft-name">{props.name}</h3>
    <hr className="nft-sep" />
    <h4 className="nft-price">Price: {props.price}</h4>
    <h5 className="nft-account">Account: {props.account}</h5>
  </div>
)

const mapStateToProps = (state: { exReducer: { exValue: any; }; }) => ({
  exValue: state.exReducer.exValue
})

export default connect(mapStateToProps)(Nft);