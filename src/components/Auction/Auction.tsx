import React from 'react';
import { Link } from 'react-router-dom';
import './Auction.css';

const Auction = (props) => (
  <Link className="noLink" to={'/auctionDetails/' + props.auctionId}>
    <div className="nft">
      {/* <img src={props.img} className="nft-img" alt="nft" /> */}
      <h3 className="nft-name">{props.auctionId}</h3>
      <hr className="nft-sep" />
      {/* <h4 className="nft-price">Price: {props.price}</h4> */}
      {/* <h5 className="nft-account">Account: {props.account}</h5> */}
    </div>
  </Link>
)

export default Auction;