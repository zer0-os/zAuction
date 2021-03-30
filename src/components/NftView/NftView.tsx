import React, { useContext } from 'react';
import { connect } from 'react-redux';
import Nft from '../Nft/Nft';
import './NftView.css';

const NftView = ({db}) => (
  <div className="nft-view">
    {db.bids.map(nft => <Nft account={nft.account} img={nft.img} name={nft.name} price={nft.price} key={nft.index} />)}
  </div>
)

const mapStateToProps = (state: { exReducer: { exValue: any; }; }) => ({
  exValue: state.exReducer.exValue
})

export default connect(mapStateToProps)(NftView);