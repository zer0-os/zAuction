import axios from 'axios';

export const auctionReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_AUCTIONS":
      console.log("UPDATE_AUCTIONS")

      // fetch auction stuff here
      let i
      let auctionBuild = [];
      const auctions = axios.get('http://localhost:5000/api/fleek/getAuctions')
      //const auctions = axios.get('https://zproxy.ilios.dev/api/fleek/getAuctions')
      .then(function (response) {
        //console.log(response);
        for (i=0;i<response.data.length;i++) {
          auctionBuild.push(response.data[i].key);
        }
        //console.log(auctionBuild);
      })
      .catch(function (error) {
        console.log(error);
      });

      return {
        ...state,
        auctions: auctionBuild
      }

    default:
      return state
  }
}

export const initialAuctionState = {
  auctions: null
}