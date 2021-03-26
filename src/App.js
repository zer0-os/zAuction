import React from 'react';
import fleek from '@fleekhq/fleek-storage-js'
import { Web3ReactProvider, useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected
} from '@web3-react/injected-connector'
import { UserRejectedRequestError as UserRejectedRequestErrorWalletConnect } from '@web3-react/walletconnect-connector'
import { UserRejectedRequestError as UserRejectedRequestErrorFrame } from '@web3-react/frame-connector'
import { Web3Provider } from '@ethersproject/providers'
import { formatEther } from '@ethersproject/units'

import { useEagerConnect, useInactiveListener } from './hooks'
import {
  injected,
  network,
  walletconnect,
  walletlink,
  ledger,
  trezor,
  lattice,
  frame,
  authereum,
  fortmatic,
  magic,
  portis,
  torus
} from './connectors'

import './App.css';
import nft from './nft.png';
import Titlebar from './components/Titlebar/Titlebar.jsx';

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function getErrorMessage(error) {
  if (error instanceof NoEthereumProviderError) {
    return 'No Ethereum browser extension detected, install MetaMask on desktop or visit from a dApp browser on mobile.'
  } else if (error instanceof UnsupportedChainIdError) {
    return "You're connected to an unsupported network."
  } else if (
    error instanceof UserRejectedRequestErrorInjected ||
    error instanceof UserRejectedRequestErrorWalletConnect ||
    error instanceof UserRejectedRequestErrorFrame
  ) {
    return 'Please authorize this website to access your Ethereum account.'
  } else {
    console.error(error)
    return 'An unknown error occurred. Check the console for more details.'
  }
}


async function fleekWriteFile(apiKey, apiSecret, key, data) {
  let result;
	const input = {
		apiKey: apiKey,
		apiSecret: apiSecret,
		key: key,
		data: JSON.stringify(data)
	};
	return result = await fleek.upload(input);
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
