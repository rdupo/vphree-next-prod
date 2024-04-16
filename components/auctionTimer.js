import React, { useState, useEffect } from 'react';
import toast, {Toaster} from 'react-hot-toast'
import { ethers } from "ethers"
import auctionAddy from '../utils/auctionAddy'
import auctionAbi from '../utils/auctionAbi'
import phunkAtts from '../utils/phunkAtts' 
import Card from '../components/Card'
import { useWallet } from '../contexts/WalletContext'

const AuctionTimer = ({ targetDate, id, bidder, highBid, bidPercent }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const { connectedAddress, walletChanged } = useWallet();
  const [bid, setBid] = useState('');
  const [signer, setSigner] = useState([]);
  const aucAtts = phunkAtts[id];
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>

  const txnToast = (x, y) => {
    if (!(x instanceof Promise)) {
      // If x is not a promise, you can handle it here
      console.error('txnToast error: x is not a promise');
      return;
    }

    toast.promise(x, {
      loading: y + ' (Awaiting user confirmation)...',
      success: 'Blockchain confirmation pending...',
      error: '⚠️ Transaction failed! ⚠️',
      position: 'top-center',
    },
    {
      style: {
        minWidth: '80%',
        color: '#000',
        background: '#ffb900',
      },
      success: {
        duration:3600000,
        icon:hourglass,
      },
      loading: {
        icon:hourglass,
      },
      error: {
        icon:"",
      }
    });
  };

  //start bid functions ---------------------------------------------------
  //settle current & start new function
  async function settleNStart() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const aucHouse = new ethers.Contract(auctionAddy, auctionAbi, signer);
    const snsPromise = aucHouse.settleCurrentAndCreateNewAuction();
    txnToast(snsPromise, `Starting new auction`);
    await snsPromise
    .then(async (result) => {
      const rh = result.hash
      await mmp.waitForTransaction(rh).then((listReceipt) => {
        if (listReceipt.status === 1) { // Check if listing transaction was successful
          toast.dismiss();
          toast('Transaction confirmed!', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
          fetchDataWithRetry();
        } else {
          toast.dismiss();
          toast('⚠️ Transaction failed! ⚠️', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
        }
      });
    });
  }

  // settle & start new
  async function startNew() {
    if(signer) {
      settleNStart();
    }
  }

  //bid() function
  async function placeBid() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const aucHouse = new ethers.Contract(auctionAddy, auctionAbi, signer);
    const ethBid = ethers.utils.parseUnits(bid, 'ether');
    const bidPromise = aucHouse.createBid(id, {value: ethBid._hex});
    txnToast(bidPromise, `Placing bid for ${ethers.utils.formatUnits(ethBid,18)}Ξ`);
    await bidPromise
    .then(async (result) => {
      const rh = result.hash
      await mmp.waitForTransaction(rh).then((listReceipt) => {
        if (listReceipt.status === 1) { // Check if listing transaction was successful
          toast.dismiss();
          toast('Transaction confirmed!', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
          fetchDataWithRetry();
        } else {
          toast.dismiss();
          toast('⚠️ Transaction failed! ⚠️', {
            style: {
              minWidth: '80%',
              color: '#000',
              background: '#ffb900',
            },
          });
        }
      });
    });
  }

  // place bid
  async function bidOn() {
    if(signer) {
      placeBid();
    }
  }
  //end bid functions ---------------------------------------------------

  function calculateTimeLeft() {
    const difference = new Date(targetDate) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    } else {
      timeLeft = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  return (
    <div className="auction-wrapper inline-flex">
      <div className="auction-img-wrapper">
        <Card
          key={id}
          price=""
          atts=""
          id={id}
          coll="auc"
        />
      </div>
      <div className="auction-txt-wrapper ml-6">
        <p className="text-gray-400">Traits</p>
        <div className="collection-desc v3-txt my-1" dangerouslySetInnerHTML={{ __html: aucAtts}} />
      </div>
      <div className="auction-info-wrapper ml-6">
        <div className="text-gray-400">
            Time Remaining:{' '} 
            <span className="v3-txt">
              {timeLeft.days}:
              {timeLeft.hours < 10 ? `0${timeLeft.hours}` : timeLeft.hours}:
              {timeLeft.minutes < 10 ? `0${timeLeft.minutes}` : timeLeft.minutes}:
              {timeLeft.seconds < 10 ? `0${timeLeft.seconds}` : timeLeft.seconds}
            </span>
        </div>
        <p className="text-gray-400">Current Bid: <span className="v3-txt">{`${highBid}Ξ`}</span></p>
        <p className="text-gray-400">Bidder: <span className="v3-txt">{bidder}</span></p>
      </div>
      {!connectedAddress ?
      <div 
        className="p-3 black-bg v3-txt v3-b w-1/6 ml-4"  
        id="not-connected">
          Please connect your wallet to bid
      </div> 
      :
      timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds === 0
        ?
        <div className="auction-btn-wrapper ml-6">
          <p>Auction Ended. Help out by starting the next auction.</p>
          <button 
            className="black-bg v3-txt v3-b w-full p-1 my-2 brite" 
            onClick={() => {startNew()}}
            id="start-new-btn">
            START NEXT AUCTION
          </button>
        </div>
        :
        <div className="auction-btn-wrapper ml-6">
        <div id="enter-bid-amount">
          <input
            className="lite-v3-bg w-full p-1 my-2 black-txt" 
            type="number" 
            name="bid-amt" 
            placeholder={`Minimum bid: ${Number(highBid)*(bidPercent)}Ξ`}
            min="0"
            id="bid-amt"
            onChange={(e) => setBid(e.target.value)}
          />
          <br/>
          <button 
            className="black-bg v3-txt v3-b w-full p-1 my-2 brite" 
            onClick={() => {bidOn()}}
            id="place-bid-btn">PLACE BID
          </button>
        </div>
        </div>
      }
    </div>
  );
};

export default AuctionTimer;