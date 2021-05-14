import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Geopattern from 'geopattern';
import logo from '../../assets/imgs/logo.png';
import './Auction.css';

const Auction = (props) => {
  const [ img, setImg ] = useState();

  // on component render
  useEffect(() =>{
    setImg(Geopattern.generate(props.auctionId).toDataUri())
  }, [])

  return (
    <div className="auction">
      <Link className="noLink auction" to={'/auctionDetails/' + props.auctionId}>
          {
            img
            ? (
              <img src={img} className="auction-img" />
            )
            : (
              <img src={logo}className="auction-img" />
            )
          }
      </Link>
    </div>
  )

}

export default Auction;