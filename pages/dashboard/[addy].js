import { React, useState, useEffect, useMemo } from 'react'
import axios from 'axios'; //
import cheerio from 'cheerio'; //
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import DashCard from '../../components/dashCard'
import Card from '../../components/Card'
import LatestProp from '../../components/LatestProp'
import History from '../../components/userHistory'
import Footer from '../../components/Footer'
import Banner from '../../assets/profile-banner.png'
import Profile from '../../assets/profile-icon.png'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"
import { getNFTs } from '../../utils/getNFTsMulti'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import nllAddy from '../../utils/nllAddy'
import nllAbi from '../../utils/nllAbi'
import auctionAddy from '../../utils/auctionAddy'
import auctionAbi from '../../utils/auctionAbi'
import v3PhunkAddy from '../../utils/v3PhunkAddy'
import v3PhunkAbi from '../../utils/v3PhunkAbi'
import flywheelAddy from '../../utils/flywheelAddy'
import flywheelAbi from '../../utils/flywheelAbi'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkData'
import phunkAtts from '../../utils/phunkAtts' 
import walletHistory from '../../hooks/walletHistory' 
import nllHistory from '../../hooks/nllWalletHistory'
import AuctionTimer from '../../components/auctionTimer'

export default function V3Phunks() {
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const nftbKey = process.env.NFTBANK_API_KEY
  const walletAddy = router.query.addy || ''
  const [ensAddy, setEnsAddy] = useState('')
  const [nfts, setNFTs] = useState([]);
  const [nftsData, setNFTsData] = useState([]);
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('')
  const marketContract = v3MarketAddy
  const marketAbi = v3MarketAbi
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [signer, setSigner] = useState([]);
  const contract = new ethers.Contract(marketContract, marketAbi, provider);
  const v3Contract = new ethers.Contract(v3PhunkAddy, v3PhunkAbi, provider)
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>
  /*filter vars*/
  const [f, setF] = useState({})
  const [beard, setBeard] = useState("")
  const [cheeks, setCheeks] = useState("")
  const [ears, setEars] = useState("")
  const [emotion, setEmotion] = useState("")
  const [eyes, setEyes] = useState("")
  const [face, setFace] = useState("")             
  const [hair, setHair] = useState("")
  const [lips, setLips] = useState("")
  const [mouth, setMouth] = useState("")
  const [neck, setNeck] = useState("")
  const [nose, setNose] = useState("")                
  const [sex, setSex] = useState("")  
  const [teeth, setTeeth] = useState("")             
  const [atts, setAtts] = useState("")
  const [isListed, setIsListed] = useState("")
  const [hasBid, setHasBid] = useState("")
  const [filtersActive, setFilterState] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [fP, setFP] = useState([])
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(true);
  //listing & bid info
  const [listVal, setListVal] = useState("");
  const [listed, setListed] = useState([]);
  const [bidVal, setBidVal] = useState("");
  const [bidsRecieved, setBidsRecieved] = useState([]);
  const [bidPlacedVal, setBidPlacedVal] = useState("");
  const [bidsPlaced, setBidsPlaced] = useState([]);
  const [bidPlacedMinVal, setBidPlacedMinVal] = useState([]);
  //history
  const { transactionHistory } = walletHistory(walletAddy);
  const { nllTxnHistory } = nllHistory(walletAddy);
  //collection displayed
  const [activeCollection, setActiveCollection] = useState("v3");
  //auction
  const aucContract = new ethers.Contract(auctionAddy, auctionAbi, provider);
  const [aucData, setAucData] = useState([]);
  const [bidInc, setBidInc] = useState();
  const [aucBidder, setAucBidder] = useState();
  const [aucEvent, setAucEvent] = useState([]);
  //flywheel
  // 1) get price estimate from NFTBank API
  // 2) get pctOfOraclePriceEstimateToPay using contractConfig method from flywheel contract
  // 3) multiply price by % of estimate to pay
  const flywheelContract = new ethers.Contract(flywheelAddy, flywheelAbi, provider);

  /*const getValue = async (ac, tid) => {
    const fetch = require('node-fetch');
    const url = `https://api.nftbank.run/v1/nft/${ac}/${tid}/estimate?networkId=ethereum`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json', 
        'x-api-key': nftbKey,
        'Access-Control-Allow-Credentials':'true',
        'Access-Control-Allow-Origin':'*'
      }
    };

    fetch(url, options)
      .then(res => res.json())
      .then(json => console.log(json))
      .catch(err => console.error('error:' + err));

    const percentOfValue = await flywheelContract.contractConfig();
    console.log(ethers.utils.formatUnits(percentOfValue.pctOfOraclePriceEstimateToPay._hex,2));
  }*/

  const curAuc = async () => {
    const aucDetails = await aucContract.auction();
    const name = await provider.lookupAddress(aucDetails.bidder);
    const aucMinBidPerc = await aucContract.minBidIncrementPercentage();
    const aucPhunk = (ethers.utils.formatUnits(aucDetails.phunkId._hex,0));
    setAucData(aucDetails);
    setBidInc(1+(Number(aucMinBidPerc)/100));
    setAucBidder(name ? name : aucDetails.bidder.substr(0,4)+'...'+aucDetails.bidder.substr(aucDetails.bidder.length-4, aucDetails.bidder.length))
  }

  useEffect(() => {    
    //events
    const eventNames = ["AuctionBid", "AuctionExtended", 
      "AuctionSettled", "AuctionCreated"];

    //event listeners
    eventNames.forEach(eventName => {
      aucContract.on(eventName, (event) => {
        console.log("Auction Event:", event);
        setAucEvent(event);
      });
    });

    //clear event listeners on unmount
    return () => {
      eventNames.forEach(eventName => {
        aucContract.removeAllListeners(eventName);
      });
    };
  }, []);

  const collUpdate = (x) => {
    setActiveCollection((prevValue) => (x));
    setLoading(true);
    setBidLoading(true);
  }

  if(typeof(router.query.addy) !== 'undefined'){
    sessionStorage.setItem('dashAddy', router.query.addy);
  }

  //NEW VERSION filtering
  useEffect(() => {
    function filterPhunks() {
      // Base filtering based on attributes
      let filteredPhunks = nftsData.filter(
        (i) =>
          Object.entries(f).every(([k, v]) => k === 'tokenId' ? i.tokenId.toString().indexOf(v) > -1 : i[k] === v)
      );

      // Additional filtering based on isListed condition
      if (isListed === "1") {
        filteredPhunks = filteredPhunks.filter((i) => {
          return listed.some((list) => list .tokenId === i.tokenId);
        });
      }

      // Additional filtering based on hasBid condition
      if (hasBid === "1") {
        filteredPhunks = filteredPhunks.filter((i) => {
          return bidsRecieved.some((bid) => bid.tokenId === i.tokenId);
        });
      }

      return filteredPhunks;
    }

    const filteredPhunks = filterPhunks();
    setFP(filteredPhunks);
  }, [f, nftsData, isListed, hasBid]);

  const filteredPhunksMemo = useMemo(() => fP, [fP]);

  //toggle class
  const filterToggle = () => {
    setFilterState((current) => !current)
  }
  /* -- end filter js -- */

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

  //listings
  const fetchListings = async () => {
    if(typeof(walletAddy) !== 'undefined' && walletAddy.length > 1 && activeCollection === 'v3'){      
      const initialActiveListings = [];
      const phunkIds = [];
      const currentListings = [];

      const phunkOfferedFilter = contract.filters.PhunkOffered(null, null, walletAddy, null);
      const phunkBoughtFilter = contract.filters.PhunkBought(null, null, walletAddy, null);
      const phunkNoLongerForSaleFilter = contract.filters.PhunkNoLongerForSale();
      const phunkXferFilter = v3Contract.filters.Transfer(walletAddy, null, null);

      const initialPhunkOfferedEvents = await contract.queryFilter(phunkOfferedFilter);
      const initialPhunkBoughtEvents = await contract.queryFilter(phunkBoughtFilter);
      const initialphunkNoLongerForSaleEvents = await contract.queryFilter(phunkNoLongerForSaleFilter);
      const initialPhunkXferEvents = await v3Contract.queryFilter(phunkXferFilter, 19085195);

      const allEvents = [...initialPhunkOfferedEvents,
                         ...initialPhunkBoughtEvents, 
                         ...initialphunkNoLongerForSaleEvents,
                         ...initialPhunkXferEvents]

      // Sort the initialPhunkOfferedEvents by phunkIndex and blockNumber (newest to oldest)
      allEvents.sort((a, b) => {
        return b.blockNumber - a.blockNumber; // Sort by blockNumber if phunkIndexes are equal
      });

      // Iterate through sorted events and select the first occurrence of each unique phunkIndex
      allEvents.forEach(event => {
        const phunkIndex = typeof(event.args.phunkIndex) !== 'undefined' ? event.args.phunkIndex._hex : event.args.tokenId._hex;
        if (phunkIds.indexOf(phunkIndex) === -1) {
          phunkIds.push(phunkIndex);
          initialActiveListings.push(event);
        }
      });

      const updatedListings = initialActiveListings.filter((event) => event.event == 'PhunkOffered')

      updatedListings.map(listing => (
        currentListings.push({
          tokenId:Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0)),
          minValue: Number(ethers.utils.formatUnits(listing.args.minValue._hex, 18)),
        })
      ));
      
      let ethSum = 0;
      for(let i = 0; i < currentListings.length; i++) {
        ethSum += currentListings[i].minValue;
      }

      setListVal(ethSum);
      setListed(currentListings);
    }

    if(typeof(walletAddy) !== 'undefined' && walletAddy.length > 1 && activeCollection === 'v2'){
      const currentListings = [];

      //define nll contract
      const nll = new ethers.Contract(nllAddy, nllAbi, provider);
      
      //get listing data and push to empty array
      for (var i = nfts.length - 1; i >= 0; i--) {
        const nllList = await nll.phunksOfferedForSale(nfts[i]);
        if(nllList.isForSale){          
          currentListings.push({
            tokenId:Number(nllList.phunkIndex),
            minValue: Number(nllList.minValue)/1000000000000000000,
          }) 
        } 
      }

      let ethSum = 0;
      for(let i = 0; i < currentListings.length; i++) {
        ethSum += currentListings[i].minValue;
      }

      setListVal(ethSum);
      setListed(currentListings);
    }
  };

  //bids
  const fetchBids = async () => {
    let mAddy, mAbi;
    const initialActiveBids = [];
    const phunkIds = [];
    const currentBids = [];
    const myCurrentBids = [];

    if (activeCollection === 'v2') {
      mAddy = nllAddy;
      mAbi = nllAbi;
    } else if (activeCollection === 'v3') {
      mAddy = v3MarketAddy;
      mAbi = v3MarketAbi;
    }

    if(mAddy && mAbi) {

      const mContract = new ethers.Contract(mAddy, mAbi, provider);
      const phunkBidFilter = mContract.filters.PhunkBidEntered();
      const phunkBidWithdrawnFilter = mContract.filters.PhunkBidWithdrawn();

      const initialBidEvents = await mContract.queryFilter(phunkBidFilter);
      const initialBidWithdrawnEvents = await mContract.queryFilter(phunkBidWithdrawnFilter);

      const allBidEvents = [...initialBidEvents,
                         ...initialBidWithdrawnEvents]

      // Sort the initialPhunkOfferedEvents by phunkIndex and blockNumber (newest to oldest)
      allBidEvents.sort((a, b) => {
        return b.blockNumber - a.blockNumber; // Sort by blockNumber if phunkIndexes are equal
      });

      // Iterate through sorted events and select the first occurrence of each unique phunkIndex
      allBidEvents.forEach(event => {
        const phunkIndex = typeof(event.args.phunkIndex) !== 'undefined' ? event.args.phunkIndex._hex : event.args.tokenId._hex;
        if (phunkIds.indexOf(phunkIndex) === -1) {
          phunkIds.push(phunkIndex);
          initialActiveBids.push(event);
        }
      });

      const allBids = initialActiveBids.filter((event) => event.event === 'PhunkBidEntered');

      //console.log('nfts', nfts); 
      const updatedBids = allBids.filter((event) => {
        return nfts.includes(Number(ethers.utils.formatUnits(event.args.phunkIndex._hex,0)));
      });
      //console.log('bids recieved', updatedBids); //0x60 == 96

      const myBids = allBids.filter((event) => event.args.fromAddress.toLowerCase() === walletAddy.toLowerCase());
      //console.log('bids placed', myBids);

      updatedBids.map(listing => (
        currentBids.push({
          tokenId:Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0)),
          bidValue: Number(ethers.utils.formatUnits(listing.args.value._hex, 18)),
        })
      ));

      myBids.map(listing => (
        myCurrentBids.push({ 
          tokenId:Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0)),
          bidValue: Number(ethers.utils.formatUnits(listing.args.value._hex, 18)),
          atts: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].atts,
          beard: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].beard,
          cheeks: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].cheeks,
          ears: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].ears,
          emotion: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].emotion,
          eyes: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].eyes,
          face: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].face,
          hair: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].hair,
          lips: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].lips,
          mouth: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].mouth,
          neck: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].neck,
          nose: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].nose,
          sex: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].sex,
          teeth: phunks[Number(ethers.utils.formatUnits(listing.args.phunkIndex._hex,0))].teeth,
        })
      ));

      const myBidVals = [];
      for (let i = 0; i < myBids.length; i++){
        const myBidListData = await contract.phunksOfferedForSale(myCurrentBids[i].tokenId);
        //console.log('mbld:', myBidListData);
        myBidVals.push({
          tokenId:myCurrentBids[i].tokenId,
          minValue:myBidListData.isForSale ? Number(ethers.utils.formatUnits(myBidListData.minValue._hex,18)) : ''
        })
      }
      
      let ethSum = 0;
      for(let i = 0; i < currentBids.length; i++) {
        ethSum += currentBids[i].bidValue;
      }

      let bidSum = 0;
      for(let i = 0; i < myCurrentBids.length; i++) {
        bidSum += myCurrentBids[i].bidValue;
      }

      //console.log('bidVals: ', myBidVals);

      setBidVal(ethSum);
      setBidsRecieved(currentBids);
      setBidPlacedVal(bidSum);
      setBidsPlaced(myCurrentBids);
      setBidPlacedMinVal(myBidVals);
    }
  };

  //owned nfts
  async function fetchNFTs(x) {
    const thisAddy = x;
    const nftIds = await getNFTs(thisAddy, activeCollection);
    const pWith = await contract.pendingWithdrawals(thisAddy);
    const withEth = Number(Number(pWith._hex)/1000000000000000000).toFixed(3);
    setPendingWithdrawAmt(withEth);
    setNFTs(nftIds);

    //start filtering
    const numericIds = nftIds.map(Number);
    const ownedNfts = phunks.filter(item => numericIds.includes(item.tokenId));
    //console.log('owned: ',ownedNfts);
    setNFTsData(ownedNfts);
    //console.log('nftsData: ', nftsData);
    //end filtering
  }

  //helper function to get minValue using tokenId
  function getMinVal(tokenId, listedArray) {
    const listing = listedArray.find(entry => entry.tokenId === tokenId);
    return listing ? listing.minValue : ''; // Return empty string if tokenId not found in listings
  }

  function getBidVal(tokenId, bidArray) {
    const bidR = bidArray.find(entry => entry.tokenId === tokenId);
    return bidR ? bidR.bidValue : ''; // Return empty string if tokenId not found in listings
  }

  useEffect(() => {
    curAuc();
  },[aucEvent])

  useEffect(() => {
    async function fetchData() {
      if(walletAddy.length > 1 && typeof(walletAddy) !== 'undefined'){
        await fetchNFTs(walletAddy);
        setLoading(false);
      }
      const name = await provider.lookupAddress(walletAddy);
      setEnsAddy(name)
    }
    fetchData();
  }, [walletAddy, activeCollection]);

  useEffect(() => {
    async function bnl() {
      await fetchBids();
      await fetchListings();
      setBidLoading(false);      
    }
    bnl();
    //getValue(v3PhunkAddy, '0');    
  },[nfts, walletAddy])

  // Route to new page on wallet change
  useEffect(() => {
    if (walletChanged) {
      Router.push({pathname: `/account/${connectedAddress}`})
    }
  }, [connectedAddress, walletChanged]);

  //withdraw() function
  async function withdrawMyEth() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const withdrawPromise = cpmp.withdraw();
    txnToast(withdrawPromise, `Withdrawing ${pendingWithdrawAmt}Ξ`);
    await withdrawPromise
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

  //withdraw
  async function withdraw() {
    if(signer) {
      withdrawMyEth()
    }
  }

  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page bg-opacity-30 bg-black">
        <div className="content px-8 z-10">
        	<h1 className="v3-txt mr-auto text-5xl pt-4">
            <Image
              height={40}
              className="inline-flex align-middle my-3 mr-4 h-img" 
              src={Profile}
              alt="profile icon"
            />
            <a 
              href={`https://etherscan.io/address/${walletAddy}`}
              target="_blank"
            >
              {ensAddy && ensAddy.length > 4 ? 
               ensAddy :
               walletAddy.substr(0,4) + "..." + walletAddy.substr(walletAddy.length - 4, walletAddy.length)
              }
            </a>
          </h1>           
          { connectedAddress === walletAddy && pendingWithdrawAmt > 0 ?
            <div className="my-2">
              <button 
                className="cta b-b bg-[#ffba00] black-txt brite"
                onClick={() => {withdraw()}}
              >
                WITHDRAW {pendingWithdrawAmt}Ξ
              </button>
            </div>
            :
            null
          }
          <div className="picker-div divide-x-2 divide-gray-500 text-gray-500">
            <p 
              className={`picker mt-6 pr-4 text-3xl cursor-pointer ${activeCollection === 'v3' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('v3')}>v3Phunks</p>
            <p 
              className={`picker mt-6 px-4 text-3xl cursor-pointer ${activeCollection === 'v2' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('v2')}>CryptoPhunks</p>
            <p 
              className={`picker mt-6 px-4 text-3xl cursor-pointer ${activeCollection === 'v1' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('v1')}>Philips</p>
          </div>
          <p className="text-xl text-gray-300">
            {!loading ? nfts.length : '-'} owned
          </p>
          {activeCollection === 'v1' ? null :<p className="text-xl text-gray-300">
            {!bidLoading ? listed.length : '-'} listed totaling {!bidLoading ? listVal : '-'}Ξ 
          </p>}
          {activeCollection === 'v1' ? null :<p className="text-xl text-gray-300">
            {!bidLoading ? bidsRecieved.length : '-'} bid(s) recieved totaling {!bidLoading ? bidVal : '-'}Ξ 
          </p>}
          {activeCollection === 'v1' ? null :<p className="text-xl text-gray-300">
            {!bidLoading ? bidsPlaced.length : '-'} bid(s) placed totaling {!bidLoading ? bidPlacedVal : '-'}Ξ
          </p>}
          <h2 className="mt-8 text-2xl">Owned</h2> 
          <div className="filter-sort-wrapper mb-4">
            <div>
              <label className="mr-3">ID</label>
              <input 
                type="text" 
                id="id" 
                className="lite-v3-bg black-txt mr-4" 
                name="id" 
                minLength="1" 
                maxLength="4" 
                placeholder="Phunk ID..." 
                onChange={(e) => setF((prevState) => ({ ...prevState, tokenId: e.target.value }))}
              />
              <div className="p-0 filter-dropdown" data-type="list-state">
                <select 
                  className="select-short lite-v3-bg" 
                  type="text" 
                  value={isListed}
                  onChange={(e) => {
                    setIsListed(e.target.value)
                  }}
                >
                  <option value="" disabled hidden>List Status</option>
                  <option value="1">Listed</option>
                </select>
                <div className="input-group-append">
                  <button 
                    className="btn-outline v3-bg" 
                    onClick={() => {
                      setIsListed("");
                    }} 
                    type="button">x</button>
                </div>
              </div>
              <div className="p-0 filter-dropdown" data-type="bid-state">
                <select 
                  className="select-short lite-v3-bg" 
                  type="text" 
                  value={hasBid}
                  onChange={(e) => {
                    setHasBid(e.target.value)
                  }}
                >
                  <option value="" disabled hidden>Bid Status</option>
                  <option value="1">Has Bid</option>
                </select>
                <div className="input-group-append">
                  <button 
                    className="btn-outline v3-bg" 
                    onClick={() => {
                      setHasBid("");
                    }} 
                    type="button">x</button>
                </div>
              </div>
              <button 
                id="view-mr" 
                className={`v3-bg black-txt brite ${filtersActive ? 'hidden' : ''}`} 
                onClick={filterToggle}>
                View Trait Filters
              </button>
              <button 
                id="hide-mr" 
                className={`v3-bg black-txt brite ${filtersActive ? '' : 'hidden'}`} 
                onClick={filterToggle}>
                Hide Trait Filters
              </button>
            </div>
            <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
                <div className="p-0 filter-dropdown" data-type="beard ">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={beard}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, beard: e.target.value }));
                      setBeard(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Beard</option>
                    <option value="NA">None</option>
                    <option value="Big-Beard">Big Beard</option>
                    <option value="Chinstrap">Chinstrap</option>
                    <option value="Front-Beard">Front Beard</option>
                    <option value="Front-Beard-Dark">Front Beard Dark</option>
                    <option value="Goat">Goat</option>
                    <option value="Handlebars">Handlebars</option>
                    <option value="Luxurious-Beard">Luxurious Beard</option>
                    <option value="Mustache">Mustache</option>
                    <option value="Muttonchops">Muttonchops</option>
                    <option value="Normal-Beard">Normal Beard</option>
                    <option value="Normal-Beard-Black">Normal Beard Black</option>
                    <option value="Shadow-Beard">Shadow Beard</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg"
                      onClick={() => {
                        setF((prevState) => {
                          // Create a copy of the state to avoid modifying it directly
                          const updatedState = { ...prevState };
                          // Remove the 'beard' property from the state
                          delete updatedState.beard;
                          // Return the updated state
                          return updatedState;
                        });
                        setBeard("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="cheeks">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={cheeks}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, cheeks: e.target.value }));
                      setCheeks(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Cheeks</option>
                    <option value="NA">None</option>
                    <option value="Rosy-Cheeks">Rosy Cheeks</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.cheeks;
                          return updatedState;
                        });
                        setCheeks("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="ears">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={ears}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, ears: e.target.value }));
                      setEars(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Ears</option>
                    <option value="NA">None</option>
                    <option value="Earring">Earring</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.ears;
                          return updatedState;
                        });
                        setEars("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="emotion">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={emotion}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, emotion: e.target.value }));
                      setEmotion(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Emotion</option>
                    <option value="NA">None</option>
                    <option value="Frown">Frown</option>
                    <option value="Smile">Smile</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.emotion;
                          return updatedState;
                        });
                        setEmotion("");
                      }}  
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="eyes">
                  <select 
                    className="select lite-v3-bg" 
                    type="text"
                    value={eyes}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, eyes: e.target.value }));
                      setEyes(e.target.value)
                    }}>
                    <option value="" disabled hidden>Eyes</option>
                    <option value="NA">None</option>
                    <option value="3D-Glasses">3D Glasses</option>
                    <option value="Big-Shades">Big Shades</option>
                    <option value="Blue-Eye-Shadow">Blue Eye Shadow</option>
                    <option value="Classic-Shades">Classic Shades</option>
                    <option value="Clown-Eyes-Blue">Clown Eyes Blue</option>
                    <option value="Clown-Eyes-Green">Clown Eyes Green</option>
                    <option value="Eye-Mask">Eye Mask</option>
                    <option value="Eye-Patch">Eye Patch</option>
                    <option value="Green-Eye-Shadow">Green Eye Shadow</option>
                    <option value="Horned-Rim-Glasses">Horned Rim Glasses</option>
                    <option value="Nerd-Glasses">Nerd Glasses</option>
                    <option value="Purple-Eye-Shadow">Purple Eye Shadow</option>
                    <option value="Regular-Shades">Regular Shades</option>
                    <option value="Small-Shades">Small Shades</option>
                    <option value="VR">VR</option>
                    <option value="Welding-Goggles">Welding Goggles</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.eyes;
                          return updatedState;
                        });
                        setEyes("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="face">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={face}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, face: e.target.value }));
                      setFace(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Face</option>
                    <option value="NA">None</option>
                    <option value="Mole">Mole</option>
                    <option value="Spots">Spots</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.face;
                          return updatedState;
                        });
                        setFace("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="hair">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={hair}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, hair: e.target.value }));
                      setHair(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Hair</option>
                    <option value="NA">None</option>
                    <option value="Bandana">Bandana</option>
                    <option value="Beanie">Beanie</option>
                    <option value="Blonde-Bob">Blonde Bob</option>
                    <option value="Blonde-Short">Blonde Short</option>
                    <option value="Cap">Cap</option>
                    <option value="Cap-Forward">Cap Forward</option>
                    <option value="Clown-Hair-Green">Clown Hair Green</option>
                    <option value="Cowboy-Hat">Cowboy Hat</option>
                    <option value="Crazy-Hair">Crazy Hair</option>
                    <option value="Dark-Hair">Dark Hair</option>
                    <option value="Do-rag">Do-rag</option>
                    <option value="Fedora">Fedora</option>
                    <option value="Frumpy-Hair">Frumpy Hair</option>
                    <option value="Half-Shaved">Half Shaved</option>
                    <option value="Headband">Headband</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Knitted-Cap">Knitted Cap</option>
                    <option value="Messy-Hair">Messy Hair</option>
                    <option value="Mohawk">Mohawk</option>
                    <option value="Mohawk-Dark">Mohawk Dark</option>
                    <option value="Mohawk-Thin">Mohawk Thin</option>
                    <option value="Orange-Side">Orange Side</option>
                    <option value="Peak-Spike">Peak Spike</option>
                    <option value="Pigtails">Pigtails</option>
                    <option value="Pilot-Helmet">Pilot Helmet</option>
                    <option value="Pink-With-Hat">Pink With Hat</option>
                    <option value="Police-Cap">Police Cap</option>
                    <option value="Purple-Hair">Purple Hair</option>
                    <option value="Red-Mohawk">Red Mohawk</option>
                    <option value="Shaved-Head">Shaved Head</option>
                    <option value="Straight-Hair">Straight Hair</option>
                    <option value="Straight-Hair-Blonde">Straight Hair Blonde</option>
                    <option value="Straight-Hair-Dark">Straight Hair Dark</option>
                    <option value="Stringy-Hair">Stringy Hair</option>
                    <option value="Tassle-Hat">Tassle Hat</option>
                    <option value="Tiara">Tiara</option>
                    <option value="Top-Hat">Top Hat</option>
                    <option value="Vampire-Hair">Vampire Hair</option>
                    <option value="Wild-Blonde">Wild Blonde</option>
                    <option value="Wild-Hair">Wild Hair</option>
                    <option value="Wild-White-Hair">Wild White Hair</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.hair;
                          return updatedState;
                        });
                        setHair("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="lips">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={lips}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, lips: e.target.value }));
                      setLips(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Lips</option>
                    <option value="NA">None</option>
                    <option value="Black-Lipstick">Black Lipstick</option>
                    <option value="Hot-Lipstick">Hot Lipstick</option>
                    <option value="Purple-Lipstick">Purple Lipstick</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.lips;
                          return updatedState;
                        });
                        setLips("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="mouth">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={mouth}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, mouth: e.target.value }));
                      setMouth(e.target.value)
                    }}
                    >
                    <option value="" disabled hidden>Mouth</option>
                    <option value="NA">None</option>
                    <option value="Cigarette">Cigarette</option>
                    <option value="Medical-Mask">Medical Mask</option>
                    <option value="Pipe">Pipe</option>
                    <option value="Vape">Vape</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.mouth;
                          return updatedState;
                        });
                        setMouth("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="neck">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={neck}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, neck: e.target.value }));
                      setNeck(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Neck</option>
                    <option value="NA">None</option>
                    <option value="Choker">Choker</option>
                    <option value="Gold-Chain">Gold Chain</option>
                    <option value="Silver-Chain">Silver Chain</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.neck;
                          return updatedState;
                        });
                        setNeck("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="nose">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={nose}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, nose: e.target.value }));
                      setNose(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Nose</option>
                    <option value="NA">None</option>
                    <option value="Clown-Nose">Clown Nose</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.nose;
                          return updatedState;
                        });
                        setNose("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="sex">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={sex}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, sex: e.target.value }));
                      setSex(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Sex</option>
                    <option value="Alien">Alien</option>
                    <option value="Ape">Ape</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Zombie">Zombie</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.sex;
                          return updatedState;
                        });
                        setSex("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="teeth">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={teeth}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, teeth: e.target.value }));
                      setTeeth(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Teeth</option>
                    <option value="NA">None</option>
                    <option value="Buck-Teeth">Buck Teeth</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.teeth;
                          return updatedState;
                        });
                        setTeeth("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="traits">
                  <select 
                    className="select lite-v3-bg" 
                    type="text" 
                    value={atts}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, atts: e.target.value }));
                      setAtts(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Trait Count</option>
                    <option value="0">0 Trait</option>
                    <option value="1">1 Trait</option>
                    <option value="2">2 Traits</option>
                    <option value="3">3 Traits</option>
                    <option value="4">4 Traits</option>
                    <option value="5">5 Traits</option>
                    <option value="6">6 Traits</option>
                    <option value="7">7 Traits</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline v3-bg" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.atts;
                          return updatedState;
                        });
                        setAtts("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
            </div>
          </div>
          <div>
          </div>
        	<div className="flex flex-wrap justify-left">
            {loading === false ?
              (nfts.length > 0 ?
                (fP.map((phunk) => (
                  <DashCard
                    key={phunk.tokenId}
                    price={getMinVal(phunk.tokenId, listed)} 
                    bid={getBidVal(phunk.tokenId, bidsRecieved)} 
                    atts={phunk.atts} 
                    id={phunk.tokenId}
                    coll={activeCollection}
                  />
                )))
                :
                activeCollection === "v3" ?
                  <p className="text-2xl text-gray-400 my-4">
                    You do not own any v3Phunks. Check out the <Link href="/collections/v3-phunks">marketplace</Link> to pick one up!
                  </p> 
                  :
                  activeCollection === "v2" ?
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any CryptoPhunks. Check out the <a target="_blank" href="https://notlarvalabs.com/cryptophunks/forsale">Not Larva Labs</a> to pick one up!
                    </p>
                    :
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any Philips. You can pick one up <a target="_blank" href="https://pro.opensea.io/collection/philipinternproject">here</a>!
                    </p>
              )
                :
              <p className="text-2xl v3-txt my-4">Fetching your Phunks...</p>
            }
        	</div>
          {activeCollection === 'v1' ? null : <h2 className="mt-8 text-2xl">Your Bids</h2>}
          {activeCollection === 'v1' ? null : 
          <div className="flex flex-wrap justify-left">
              {bidLoading === false ?
                (bidsPlaced.length > 0 ? 
                  (bidsPlaced.map((phunk) => (
                    <DashCard
                      key={phunk.tokenId}
                      price={getMinVal(phunk.tokenId, bidPlacedMinVal)}
                      bid={phunk.bidValue} 
                      atts={phunk.atts} 
                      id={phunk.tokenId}
                      coll={activeCollection}
                    />
                  )))
                  :
                  <p className="text-2xl text-gray-400 my-4">You do not have any active bids.</p>
                )
                :
              <p className="text-2xl v3-txt my-4">Fetching your bids...</p>
            }
          </div>}
          {activeCollection === 'v1' ? null : <h2 className="mt-8 text-2xl">Instant Liquidity</h2>}
          {activeCollection === 'v1' ? null : <div>
            {activeCollection !== 'v2' ? null : <p><a 
              href="https://www.phunks.pro/" 
              target="_blank">Check Flywheel Eligibility
            </a></p>} 
            <p><a 
              href={`https://nftx.io/vault/${activeCollection === 'v2' ? '0xb39185e33e8c28e0bb3dbbce24da5dea6379ae91' : '0x4fae03385dcf5518dd43c03c2f963092c89de33c'}/sell/`} 
              target="_blank">Sell to NTFX Liquidity Pool
            </a></p>         
          </div>}
          {activeCollection !== 'v2' ? null : <h2 className="mt-8 text-2xl">Current Auction</h2>}
          {activeCollection !== 'v2' ? null : 
            <AuctionTimer
              targetDate={Number(ethers.utils.formatUnits(aucData.endTime._hex,0))*1000}
              id={ethers.utils.formatUnits(aucData.phunkId._hex,0)}
              bidder={aucBidder}
              highBid={ethers.utils.formatUnits(aucData.amount._hex,18)}
              bidPercent={bidInc}
            />
          }
          <LatestProp/>
          {activeCollection !== 'v3' ? null : <h2 className="mt-8 text-2xl">vPhree Activity</h2>}
          {activeCollection !== 'v3' ? null : <div className="row-wrapper my-2">
            {loading === false ?
              <History 
                transactions={transactionHistory}
                mp="vPhree"
              />
              :
              <p className="text-2xl v3-txt my-4">Loading vPhree transaction history...</p>
            }
          </div>}
          {activeCollection !== 'v2' ? null : <h2 className="mt-8 text-2xl">NLL Activity</h2>}
          {activeCollection !== 'v2' ? null : <div className="row-wrapper my-2">
            {loading === false ?
              <History 
                transactions={nllTxnHistory}
                mp="NLL"
              />
              :
              <p className="text-2xl v3-txt my-4">Loading NLL transaction history...</p>
            }
          </div>}
          <h2 className="mt-8 text-2xl">Links</h2>
          {activeCollection === 'v1' ? 
            <div>
              <h3 className="mt-4">Marketplace</h3>
              <p><a target="_blank" href="https://pro.opensea.io/collection/philipinternproject">OpenSea Pro - PhilipInternProject</a></p>
              <p><a target="_blank" href="https://pro.opensea.io/collection/official-v1-phunks">OpenSea Pro - v1Phunks (Wrapped)</a></p>

              <h3 className="mt-4">Wrapper</h3>
              <p><a target="_blank" href="https://v1phunks.io/">Philip Wrapper</a></p>

              <h3 className="mt-4">Contract</h3>
              <p><a target="_blank" href="https://etherscan.io/address/0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce">PhilipInternProject Contract</a></p>

              <h3 className="mt-4">Twitter</h3>
              <p><a target="_blank" href="https://twitter.com/CryptoPhunksV1">Philips</a></p>

              <h3 className="mt-4">Websites</h3>
              <p><a target="_blank" href="https://cryptophunks.com/">CryptoPhunks Website</a></p>
              <p><a target="_blank" href="https://phunks.net/">Phunks.net</a></p>

              <h3 className="mt-4">Resources</h3>
              <p><a target="_blank" href="https://phunks.gitbook.io/">Phunks GitBook</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/jucx14px2ogalkc/AADHnFyBd7tFkodw6pCV84CFa?dl=0">Phunky Media Machine</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/0xvnratb371f4u9/AAAFQN9eEECkl1K5gu4f79qIa?dl=0">Phunky GIFs</a></p>
            </div>
            :
            activeCollection === 'v2' ?
            <div>
              <h3 className="mt-4">Vote!</h3>
              <p><a target="_blank" href="https://phunk.cc/">Treasury Prop Voting</a></p>

              <h3 className="mt-4">Marketplace</h3>
              <p><a target="_blank" href="https://notlarvalabs.com/cryptophunks/forsale">Not Larva Labs</a></p>
              <p><a target="_blank" href="https://pro.opensea.io/collection/crypto-phunks">OpenSea Pro</a></p>

              <h3 className="mt-4">Contract</h3>
              <p><a target="_blank" href="https://etherscan.io/address/0xf07468ead8cf26c752c676e43c814fee9c8cf402">CryptoPhunks Contract</a></p>

              <h3 className="mt-4">Twitter</h3>
              <p><a target="_blank" href="https://twitter.com/CryptoPhunksV2">CryptoPhunks</a></p>
              <p><a target="_blank" href="https://twitter.com/PhunksAuction">Phunks Auction House</a></p>
              <p><a target="_blank" href="https://twitter.com/NotLarvaLabs">Not Larva Labs</a></p>
              <p><a target="_blank" href="https://twitter.com/PhunkBot">PhunkBot</a></p>

              <h3 className="mt-4">Websites</h3>
              <p><a target="_blank" href="https://cryptophunks.com/">CryptoPhunks Website</a></p>
              <p><a target="_blank" href="https://phunks.net/">Phunks.net</a></p>

              <h3 className="mt-4">Resources</h3>
              <p><a target="_blank" href="https://phunks.gitbook.io/">Phunks GitBook</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/jucx14px2ogalkc/AADHnFyBd7tFkodw6pCV84CFa?dl=0">Phunky Media Machine</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/0xvnratb371f4u9/AAAFQN9eEECkl1K5gu4f79qIa?dl=0">Phunky GIFs</a></p>
            </div> 
            :
            <div>
              <h3 className="mt-4">Marketplaces</h3>
              <p className="text-gray-400">vPhree (you are here)</p>
              <p><a target="_blank" href="https://pro.opensea.io/collection/v3phunks">OpenSea Pro</a></p>

              <h3 className="mt-4">Contract</h3>
              <p><a target="_blank" href="https://etherscan.io/address/0xb7d405bee01c70a9577316c1b9c2505f146e8842">v3Phunks Contract</a></p>

              <h3 className="mt-4">Twitter</h3>
              <p><a target="_blank" href="https://twitter.com/v3phunks">v3Phunks</a></p>
              <p><a target="_blank" href="https://twitter.com/vphree_io">vPhree</a></p>
              <p><a target="_blank" href="https://twitter.com/v3phunksbot">v3Phunks Bot</a></p>

              <h3 className="mt-4">Websites</h3>
              <p><a target="_blank" href="https://cryptophunks.com/">CryptoPhunks Website</a></p>
              <p><a target="_blank" href="https://phunks.net/">Phunks.net</a></p>

              <h3 className="mt-4">Resources</h3>
              <p><a target="_blank" href="https://phunks.gitbook.io/">Phunks GitBook</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/jucx14px2ogalkc/AADHnFyBd7tFkodw6pCV84CFa?dl=0">Phunky Media Machine</a></p>
              <p><a target="_blank" href="https://www.dropbox.com/sh/0xvnratb371f4u9/AAAFQN9eEECkl1K5gu4f79qIa?dl=0">Phunky GIFs</a></p>
            </div>
          }
        </div>
      </div>
      <div className="home-bg fixed top-0 left-0 right-0 -z-10"></div>
      <Footer
        bg='black'
      />      
    </>
  )
}