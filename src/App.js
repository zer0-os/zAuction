import { useWeb3React, Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

import './App.css';
import nft from './nft.png';
import Titlebar from './components/Titlebar/Titlebar.jsx';

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <div className="app">
    	<Titlebar />
      <div className="body">
        <div className="nft_container">
          <img src={nft} className="nft_img" alt="ntf image" />
          <div className="nft_bid_accept">
            <button
            	className="bid_btn nft-btn"
            >
            	Bid
            </button>
            <button
            	className="accept_btn nft-btn"
            >
            	Accept
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function wrappedApp() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  );
}

export default wrappedApp;
