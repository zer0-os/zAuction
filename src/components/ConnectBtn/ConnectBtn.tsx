import React, { useState } from 'react';
import { useWeb3React } from '@web3-react/core'
import './ConnectBtn.css';
import { InjectedConnector } from '@web3-react/injected-connector';
import { Web3ReactContextInterface } from '@web3-react/core/dist/types';
export const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] });

async function connectInjected (w3r: Web3ReactContextInterface<any>) {
  w3r.activate(injected)
}

const ConnectBtn = () => {
	const w3r = useWeb3React()
	const [connectBtnText, setConnectBtnText] = useState('Connect')
	const [connectBtnColor, setConnectBtnColor] = useState('#f45d64')

  return (
		<div>
			{
				!w3r.active
				? (
					<button
						className="connect_btn"
						style={{backgroundColor: connectBtnColor}}
						onClick={() => {
							connectInjected(w3r).then(() => {
								setConnectBtnText("Connected")
								setConnectBtnColor("#44aa44")
							})
						}}
					>
						{ connectBtnText }
					</button> 
				)
				: (
					<button
						className="connect_btn"
						style={{backgroundColor: connectBtnColor}}
						onClick={() => {
							connectInjected(w3r).then(() => {
								console.log(w3r)
							})
						}}
					>
						{ connectBtnText }
					</button> 
				)
			}

		</div>


  )
}
export default ConnectBtn
