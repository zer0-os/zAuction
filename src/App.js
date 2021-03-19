import './App.css';
import nft from './nft.png';
import Titlebar from './components/Titlebar/Titlebar.jsx';

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

export default App;
