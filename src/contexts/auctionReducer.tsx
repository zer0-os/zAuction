export const auctionReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_AUCTIONS":
      console.log("UPDATE_AUCTIONS")
      // fetch auction stuff here
      return {
        ...state,
        active: !state.active
      }

    default:
      return state
  }
}

export const initialAuctionState = {
  active: false,
  user: null
}