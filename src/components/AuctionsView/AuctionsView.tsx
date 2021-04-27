import React, { useContext, useEffect, useState } from 'react';
import './AuctionsView.css';
import {AuctionContext} from '../../contexts/auctionContext';
import Auction from '../Auction/Auction';


const AuctionsView = () => {
  const { bids } = useContext(AuctionContext);
  const [lbids, setLbids] = useState([]);

  useEffect(() =>{
    if (bids.length) {
      let newBids = [...lbids];
      newBids = newBids.concat(bids);
      setLbids(newBids);
    }
  }, [bids])

  return lbids.length ? (
    <div>
      <h1 className="title">Auctions</h1>
      <div className="nft-view">
          {lbids.map(nft => <Auction account={nft.account} img={nft.img} name={nft.name} price={nft.price} key={nft.index} />)}
      </div>
    </div>
  ) : (
    <div className="text-center mt-5">
        <h1 className="title">Auctions</h1>
        <h1 style={{color:"white"}}>Loading Bids...</h1>
    </div>
  )

}

export default AuctionsView;