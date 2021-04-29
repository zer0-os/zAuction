import {createContext, useReducer} from 'react';

import React from "react"
import { auctionReducer, initialAuctionState } from "./auctionReducer"

export const AuctionContext = createContext({
  state: initialAuctionState,
  dispatch: () => null
})

export const AuctionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(auctionReducer, initialAuctionState)

  return (
    <AuctionContext.Provider value={[ state, dispatch ]}>
    	{ children }
    </AuctionContext.Provider>
  )
}