import React, { useState, useContext } from 'react';
import { useWeb3React } from '@web3-react/core'
import './ConnectBtn.css';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Web3ReactContextInterface } from '@web3-react/core/dist/types';

import { UserContext } from '../../contexts/userContext';
import { connect } from 'react-redux';

export const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });

async function connectInjected (w3r: Web3ReactContextInterface<any>) {
  w3r.activate(injected)
}

const ConnectBtn = () => {
	const w3r = useWeb3React()
	const [state, dispatch] = useContext(UserContext);
	const [connectBtnText, setConnectBtnText] = useState('Connect')
	const [connectBtnColor, setConnectBtnColor] = useState('#f45d64')
	const { account, library, chainId } = useWeb3React()

	// dispatch account info to userContext on change
  React.useEffect((): any => {
    	  dispatch({ type: "UPDATE_USER", payload: account });
	}, [account,dispatch])
	
	function connect() {
		connectInjected(w3r);
	}

  return (
		<div>
			{
				!w3r.active
				? (
					<button
						className="connect_btn"
						style={{backgroundColor: "#f45d64"}}
						onClick={() => {
							connect();
						}}
					>
            Connect
					</button>
				)
				: (
					<button
						className="connect_btn"
						style={{backgroundColor: "#2c942c"}}
						onClick={() => {
							connectInjected(w3r).then(() => {
								//console.log(w3r)
								//setUser(w3r.account)
								console.log("Connected to address", state.user)
							})
						}}
					>
            Connected
					</button> 
				)
			}

		</div>


  )
}
export default ConnectBtn
