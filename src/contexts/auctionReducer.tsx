import axios from 'axios';

export const auctionReducer = (state, action) => {
  //LogLibrary();
  switch (action.type) {
    case "UPDATE_AUCTIONS":
      //console.log("UPDATE_AUCTIONS")

      // fetch auction stuff here
      let i
      let builtAuctions= [];
      //axios.get('http://localhost:5000/api/fleek/getAuctions')
      axios.get('https://zproxy.ilios.dev/api/fleek/getAuctions')
      .then(function (response) {
        //console.log(response);
        for (i=0;i<response.data.length;i++) {
          builtAuctions.push(response.data[i].key);
        }
        //console.log(builtAuctions);
      })
      .catch(function (error) {
        console.log(error);
      });

      return {
        ...state,
        auctions: builtAuctions,
        loading: false
      }

    default:
      return state
  }
}

export const initialAuctionState = {
  auctions: [],
  loading: true
}