/* ----- WIP ----- */
import { React, useState, useEffect, useMemo } from 'react'
import toast, {Toaster} from 'react-hot-toast'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"

//components
import Header from  '../../components/Header'
import DashCard from '../../components/dashCard'
import Card from '../../components/Card'
import FlywheelCard from '../../components/flywheelCard'
import LatestProp from '../../components/LatestProp'
import History from '../../components/userHistory'
import Footer from '../../components/Footer'
import AuctionTimer from '../../components/auctionTimer'

//assets
import Banner from '../../assets/profile-banner.png'
import Profile from '../../assets/profile-icon.png'

//data
import phunks from '../../utils/phunkData'
import phunkAtts from '../../utils/phunkAtts'

//internal functions and contexts
import { getNFTs } from '../../utils/getNFTsMulti'
import { useWallet } from '../../contexts/WalletContext' 
import philipHistory from '../../hooks/philipWalletHistory'
import wv1pHistory from '../../hooks/wv1pWalletHistory'
import nllHistory from '../../hooks/nllWalletHistory'
import walletHistory from '../../hooks/walletHistory' 
import fetchNFTsForOwner from '../../hooks/alcFetchNfts'

//contract info - collection
import philipAddy from '../../utils/philipAddy'
import philipAbi from '../../utils/philipAbi'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import phunkAddy from '../../utils/phunkAddy'
import v3PhunkAddy from '../../utils/v3PhunkAddy'
import v3PhunkAbi from '../../utils/v3PhunkAbi'

//contract info - marketplace
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import nllAddy from '../../utils/nllAddy'
import nllAbi from '../../utils/nllAbi'
import philipMarketAddy from '../../utils/philipMarketAddy'
import philipMarketAbi from '../../utils/philipMarketAbi'
import wv1pAddy from '../../utils/wv1pAddy'
import wv1pAbi from '../../utils/wv1pAbi'
import auctionAddy from '../../utils/auctionAddy'
import auctionAbi from '../../utils/auctionAbi'
import flywheelAddy from '../../utils/flywheelAddy'
import flywheelAbi from '../../utils/flywheelAbi'

export default function walletView() {
  //utils
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const nftbKey = process.env.NFTBANK_API_KEY
  const walletAddy = router.query.addy || ''
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>

  //contracts
  const contract = new ethers.Contract(v3MarketAddy, v3MarketAbi, provider);
  const philipMarket = new ethers.Contract(philipMarketAddy, philipMarketAbi, provider);
  const v3Contract = new ethers.Contract(v3PhunkAddy, v3PhunkAbi, provider);
  const wv1pContract = new ethers.Contract(wv1pAddy, wv1pAbi, provider);
  const flywheelContract = new ethers.Contract(flywheelAddy, flywheelAbi, provider);

  //states
  const [active, setActive] = useState("owned");
  const [ensAddy, setEnsAddy] = useState('')
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('');
  const [philipWithdrawAmt, setPhilipWithdrawAmt] = useState('');
  const [wv1pWithdrawAmt, setWv1pWithdrawAmt] = useState('');
  const [signer, setSigner] = useState([]);
  
  //filtering
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
  const [loading, setLoading] = useState(false)//useState(true);
  const [bidLoading, setBidLoading] = useState(true);
  const filteredPhunksMemo = useMemo(() => fP, [fP]);
  
  //owned
  const [nfts, setNFTs] = useState([]);
  const [nftsData, setNFTsData] = useState([]);
  const [v1Nfts, setV1Nfts] = useState([]);
  const [wv1Nfts, setWv1Nfts] = useState([]);
  const [v2Nfts, setV2Nfts] = useState([]);
  const [v3Nfts, setV3Nfts] = useState([]);
  //const [v1Data, setV1Data] = useState([]);
  //const [wv1Data, setWv1Data] = useState([]);
  //const [v2Data, setV2Data] = useState([]);
  //const [v3Data, setV3Data] = useState([]);
  
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
  const { philipTxnHistory } = philipHistory(walletAddy);
  const { wv1pTxnHistory } = wv1pHistory(walletAddy);

  //flywheel
  const [nftEstimate, setNftEstimate] = useState([]);
  const [minFlywheelPrice, setMinFlywheelPrice] = useState();
  const [flywheelLoading, setFlywheelLoading] = useState(true);

  /* --- START STORE WALLET ADDY - MAYBE DELETE THIS??? --- */
  if(typeof(router.query.addy) !== 'undefined'){
    sessionStorage.setItem('dashAddy', router.query.addy);
  }
  /* --- END STORE WALLET ADDY - MAYBE DELETE THIS??? --- */

  /* --- START HANDLE COLLECTION STATE CHANGE --- */
  const collUpdate = (x) => {
    setActive((prevValue) => (x));
    setBidLoading(true);
    if (x === 'owned' && nfts.length > 0) {
      setLoading(false)
    } else {
      setLoading(true);
    }
  }
  /* --- END HANDLE COLLECTION STATE CHANGE --- */

  /* --- START TOAST FUNCTION --- */
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
      }
    );
  };
  /* --- END TOAST FUNCTION --- */

  /* --- START FILTERING LOGIC --- */
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
  
  const filterToggle = () => {
      setFilterState((current) => !current)
    }
  /* --- END FILTERING LOGIC --- */

  /* --- START FETCHING OWNED NFTS --- */
    const getNfts = async () => {
      const data = await fetchNFTsForOwner(walletAddy);
      const dataIds = data.map(item => Number(item.tokenId));
      setNFTs(dataIds); //ids of phunks owned accross collections

      const ownedNfts = phunks.filter(item => dataIds.includes(item.tokenId));
      setNFTsData(ownedNfts); //full metadata for owned phunks across collections

      //parse owned by collection; IDs only (numeric)
      const v1 = data
        .filter(item => item.contract.address === "0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce")
        .map(item => Number(item.tokenId))
      const wv1 = data
        .filter(item => item.contract.address === "0x235d49774139c218034c0571ba8f717773edd923")
        .map(item => Number(item.tokenId))
      const v2 = data
        .filter(item => item.contract.address === "0xf07468ead8cf26c752c676e43c814fee9c8cf402")
        .map(item => Number(item.tokenId))
      const v3 = data
        .filter(item => item.contract.address === "0xb7d405bee01c70a9577316c1b9c2505f146e8842")
        .map(item => Number(item.tokenId))

      setV1Nfts(v1);
      setWv1Nfts(wv1);
      setV2Nfts(v2);
      setV3Nfts(v3);
    };

    useEffect(() => {getNfts()},[]);
  /* --- END FETCHING OWNED NFTS --- */

  /* --- START FETCHING LISTED NFTS --- */
  //Need to update this
    //Fetch once per collection
    //Should this be moved to function setting NFTs!?
    /*
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

      if(typeof(walletAddy) !== 'undefined' && walletAddy.length > 1 && activeCollection === 'v1'){
        const currentListings = [];

        //define nll contract
        const pmp = new ethers.Contract(philipMarketAddy, philipMarketAbi, provider);
        
        //get listing data and push to empty array
        for (var i = nfts.length - 1; i >= 0; i--) {
          const pmpList = await pmp.phunksOfferedForSale(nfts[i]);
          if(pmpList.isForSale){          
            currentListings.push({
              tokenId:Number(pmpList.phunkIndex),
              minValue: Number(pmpList.minValue)/1000000000000000000,
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

      if(typeof(walletAddy) !== 'undefined' && walletAddy.length > 1 && activeCollection === 'wv1'){
        const currentListings = [];

        //define nll contract
        const pmp = new ethers.Contract(wv1pAddy, wv1pAbi, provider);
        
        //get listing data and push to empty array
        for (var i = nfts.length - 1; i >= 0; i--) {
          const pmpList = await pmp.phunksOfferedForSale(nfts[i]);
          if(pmpList.isForSale){          
            currentListings.push({
              tokenId:Number(pmpList.phunkIndex),
              minValue: Number(pmpList.minValue)/1000000000000000000,
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
    */
  /* --- END FETCHING LISTED NFTS --- */

  /* --- START FETCHING BIDS --- */
  //Need to update this
    //Fetch once per collection
    //Bids placed and received should be fetched seperately
    //Placed is on another page
    //Received may need to be part of getNfts
    /*
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
      } else if (activeCollection === 'v1') {
        mAddy = philipMarketAddy;
        mAbi = philipMarketAbi;
      } else if (activeCollection === 'wv1') {
        mAddy = wv1pAddy;
        mAbi = wv1pAbi;
      }

      if(mAddy && mAbi) {

        const mContract = new ethers.Contract(mAddy, mAbi, provider);
        const phunkBidFilter = mContract.filters.PhunkBidEntered();
        const phunkBidWithdrawnFilter = mContract.filters.PhunkBidWithdrawn();
        const filterBought = mContract.filters.PhunkBought(null, null, null, walletAddy); 

        const initialBidEvents = await mContract.queryFilter(phunkBidFilter);
        const initialBidWithdrawnEvents = await mContract.queryFilter(phunkBidWithdrawnFilter);

        const initialBoughtEvents = await mContract.queryFilter(filterBought);

        const allBidEvents = [...initialBidEvents,
                           ...initialBidWithdrawnEvents,
                           ...initialBoughtEvents]

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
    */
  /* --- END FETCHING BIDS --- */

  /* --- START HELPER FUNCTIONS --- */
  function getMinVal(tokenId, listedArray) {
    const listing = listedArray.find(entry => entry.tokenId === tokenId);
    return listing ? listing.minValue : ''; // Return empty string if tokenId not found in listings
  }
  function getBidVal(tokenId, bidArray) {
    const bidR = bidArray.find(entry => entry.tokenId === tokenId);
    return bidR ? bidR.bidValue : ''; // Return empty string if tokenId not found in listings
  }
  /* --- END HELPER FUNCTIONS --- */

  /* --- START FLYWHEEL --- */
  const getValue = async () => {
    const temp = [];
    const percentOfValue = await flywheelContract.contractConfig();
    const pct = Number(ethers.utils.formatUnits(percentOfValue.pctOfOraclePriceEstimateToPay._hex,2));

    nfts.map(async (phunk) => {
      const res = await fetch(`/api/priceEstimate/${phunkAddy}/${phunk}`);
      const data = await res.json();
      const dispEst = Number(data.data.estimate.eth)*pct;
      temp.push({
        tokenId:phunk,
        nftbEst: dispEst.toFixed(3),
      })      
    });

    setNftEstimate(temp);

    const minValue = await flywheelContract.getCurrentMinimumValidPrice();
    const minValidPrice = Number(ethers.utils.formatUnits(minValue[0]._hex,18));
    setMinFlywheelPrice(minValidPrice);
    setFlywheelLoading(false);
  };
  /* --- END FLYWHEEL --- */

  /* --- START WITHDRAW --- */
  //Need to update this - really only need 1 fuction
  async function withdrawMyEthWv1p() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(wv1pAddy, wv1pAbi, signer);
    const withdrawPromise = cpmp.withdraw();
    txnToast(withdrawPromise, `Withdrawing ${wv1pWithdrawAmt}Ξ`);
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

  async function withdraw() {
    if(signer && activeCollection === 'v3') {
      withdrawMyEth();
    }

    if(signer && activeCollection === 'v1') {
      withdrawMyEthPhilip();
    }

    if(signer && activeCollection === 'wv1') {
      withdrawMyEthWv1p();
    }
  }
  /* --- END WITHDRAW --- */

  /* --- RENDER PAGE - USE EFFECT --- */
  /*
    One wallet address change, should pull all info for each collection for wallet
    once all data is collected for wallet, then the active collection determines what's displayed
  */
  /* --- RENDER PAGE - USE EFFECT --- */

  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <h1 className="g-txt mr-auto text-5xl pt-4">
            <Image
              height={40}
              className="inline-flex align-middle my-3 mr-4 h-img to-yellow" 
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
          <div className="picker-div divide-x-2 divide-gray-500 text-gray-500">
            <p 
              className={`picker mt-6 pr-4 text-xl cursor-pointer ${active=== 'owned' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('owned')}>Owned
            </p>
            <p 
              className={`picker mt-6 px-4 text-xl cursor-pointer ${active === 'offers' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('offers')}>Offers Made
            </p>
            <p 
              className={`picker mt-6 px-4 text-xl cursor-pointer ${active === 'activity' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('activity')}>Activity
            </p>
            <p
              className={`picker mt-6 px-4 text-xl cursor-pointer ${active === 'liquidity' ? 'white-txt' : ''}`}
              onClick={() => collUpdate('liquidity')}>Liquidity
            </p>
            {
              pendingWithdrawAmt + philipWithdrawAmt + wv1pWithdrawAmt > 0 ?
              <p 
                className={`picker mt-6 px-4 text-3xl cursor-pointer ${active === 'withdraw' ? 'white-txt' : ''}`}
                onClick={() => collUpdate('withdraw')}>Withdraw Funds
              </p>
              :
              null
            }
          </div>           
          {
            active === "owned" ?
            <>
              <div className="filter-sort-wrapper mb-4">
                <div>
                  <label className="mr-3">ID</label>
                  <input 
                    type="text" 
                    id="id" 
                    className="bg-green-100 black-txt mr-4" 
                    name="id" 
                    minLength="1" 
                    maxLength="4" 
                    placeholder="Phunk ID..." 
                    onChange={(e) => setF((prevState) => ({ ...prevState, tokenId: e.target.value }))}
                  />
                  <div className="p-0 filter-dropdown" data-type="list-state">
                    <select 
                      className="select-short bg-green-100" 
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
                        className="btn-outline g-bg black-txt" 
                        onClick={() => {
                          setIsListed("");
                        }} 
                        type="button">x</button>
                    </div>
                  </div>
                  <div className="p-0 filter-dropdown" data-type="bid-state">
                    <select 
                      className="select-short bg-green-100" 
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
                        className="btn-outline g-bg black-txt" 
                        onClick={() => {
                          setHasBid("");
                        }} 
                        type="button">x</button>
                    </div>
                  </div>
                  <button 
                    id="view-mr" 
                    className={`g-bg black-txt brite ${filtersActive ? 'hidden' : ''}`} 
                    onClick={filterToggle}>
                    View Trait Filters
                  </button>
                  <button 
                    id="hide-mr" 
                    className={`g-bg black-txt brite ${filtersActive ? '' : 'hidden'}`} 
                    onClick={filterToggle}>
                    Hide Trait Filters
                  </button>
                </div>
                <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
                    <div className="p-0 filter-dropdown" data-type="beard ">
                      <select 
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt"
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
                        className="select bg-green-100" 
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
                          className="btn-outline g-bg black-txt" 
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
              <div className="justify-left">
                <p className="mt-8">Philip Intern Project</p>
                {loading === false ?
                  (nfts.length > 0 && v1Nfts.length > 0?
                    (fP
                      .filter(phunk => v1Nfts.includes(phunk.tokenId))
                      .map((phunk) => (
                      <DashCard
                        key={phunk.tokenId}
                        price={getMinVal(phunk.tokenId, listed)} 
                        bid={getBidVal(phunk.tokenId, bidsRecieved)} 
                        atts={phunk.atts} 
                        id={phunk.tokenId}
                        coll="v1"
                      />
                    )))
                    :
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any Philips. Check out the <Link href="/collections/philip-intern-project">marketplace</Link> to pick one up!
                    </p> 
                  )
                    :
                  <p className="text-2xl g-txt my-4">Fetching your Philips...</p>
                }
                <p className="mt-8">Wrapped v1 Phunks</p>
                {loading === false ?
                  (nfts.length > 0 ?
                    (fP
                      .filter(phunk => wv1Nfts.includes(phunk.tokenId))
                      .map((phunk) => (
                      <DashCard
                        key={phunk.tokenId}
                        price={getMinVal(phunk.tokenId, listed)} 
                        bid={getBidVal(phunk.tokenId, bidsRecieved)} 
                        atts={phunk.atts} 
                        id={phunk.tokenId}
                        coll="wv1"
                      />
                    )))
                    :
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any Wrapped v1 Phunks. Check out the <Link href="/collections/wrapped-v1-phunks">marketplace</Link> to pick one up!
                    </p> 
                  )
                    :
                  <p className="text-2xl g-txt my-4">Fetching your Wrapped v1 Phunks...</p>
                }
                <p className="mt-8">CryptoPhunks</p>
                {loading === false ?
                  (nfts.length > 0 && v2Nfts.length > 0 ?
                    (fP
                      .filter(phunk => v2Nfts.includes(phunk.tokenId))
                      .map((phunk) => (
                      <DashCard
                        key={phunk.tokenId}
                        price={getMinVal(phunk.tokenId, listed)} 
                        bid={getBidVal(phunk.tokenId, bidsRecieved)} 
                        atts={phunk.atts} 
                        id={phunk.tokenId}
                        coll="v2"
                      />
                    )))
                    :
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any CryptoPhunks. Check out <Link href="https://notlarvalabs.com/cryptophunks/forsale" target="_blank">Not Larva Labs</Link> to pick one up!
                    </p> 
                  )
                    :
                  <p className="text-2xl g-txt my-4">Fetching your CryptoPhunks...</p>
                }
                <p className="mt-8">v3Phunks</p>
                {loading === false ?
                  (nfts.length > 0 && v3Nfts.length > 0 ?
                    (fP
                      .filter(phunk => v3Nfts.includes(phunk.tokenId))
                      .map((phunk) => (
                      <DashCard
                        key={phunk.tokenId}
                        price={getMinVal(phunk.tokenId, listed)} 
                        bid={getBidVal(phunk.tokenId, bidsRecieved)} 
                        atts={phunk.atts} 
                        id={phunk.tokenId}
                        coll="v3"
                      />
                    )))
                    :
                    <p className="text-2xl text-gray-400 my-4">
                      You do not own any v3Phunks. Check out the <Link href="/collections/v3-phunks">marketplace</Link> to pick one up!
                    </p> 
                  )
                    :
                  <p className="text-2xl g-txt my-4">Fetching your v3Phunks...</p>
                }
              </div>
            </>
            :
            null
          }
          {
            active === "offers" ?
            <>
              <h2 className="mt-8 text-2xl">Offers Made</h2>
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
                  <p className="text-2xl g-txt my-4">Fetching your bids...</p>
                }
              </div>  
            </>
            :
            null
          }
          {
            active === "activity" ?
            <>
              {/* --- Philips --- */}
              <h2 className="mt-8 text-2xl">vPhree Activity</h2>
              {loading === false ?
                <History 
                  transactions={philipTxnHistory}
                  mp="v1"
                />
                :
                <p className="text-2xl g-txt my-4">Loading vPhree transaction history...</p>
              }

              {/* --- Wrapped v1Phunks --- */}
              <h2 className="mt-8 text-2xl">vPhree Activity</h2>
              {loading === false ?
                <History 
                  transactions={wv1pTxnHistory}
                  mp="v1"
                />
                :
                <p className="text-2xl g-txt my-4">Loading vPhree transaction history...</p>
              }

              {/* --- CryptoPhunks --- */}
              <h2 className="mt-8 text-2xl">CryptoPhunks Activity</h2>
              {loading === false ?
                <History 
                  transactions={nllTxnHistory}
                  mp="NLL"
                />
                :
                <p className="text-2xl g-txt my-4">Loading CryptoPhunks transaction history...</p>
              }

              {/* --- v3Phunks --- */}
              <h2 className="mt-8 text-2xl">v3Phunks Activity</h2>
              {loading === false ?
                <History 
                  transactions={transactionHistory}
                  mp="vPhree"
                />
                :
                <p className="text-2xl g-txt my-4">Loading v3Phunks transaction history...</p>
              }
            </>
            :
            null
          }
          {
            active === "liquidity" ?
            <>
              <h2 className="mt-8 text-2xl">Instant Liquidity</h2>
              <p>
                Explore instant liquidity options for CryptoPhunks and v3Phunks. At this time, there are no instant liquidity options for Philps or Wrapped v1 Phunks.
              </p>
              <br/>
              {flywheelLoading === false ?
                (nftEstimate.length > 0 ? 
                  (nftEstimate.map((phunk) => (
                    <FlywheelCard
                      key={`flywheel${phunk}`}
                      price={phunk.nftbEst}
                      minPrice={minFlywheelPrice}
                      atts=""
                      id={phunk.tokenId}
                    />
                  )))
                  :
                  (nfts.length > 0 ?
                   <p className="text-2xl g-txt my-4">Fetching flywheel estimates...</p>
                    :
                   <p className="text-2xl text-gray-400 my-4">Uh oh! No phunks in this wallet. </p>
                  )
                )
                  :
                <p className="text-2xl g-txt my-4">Fetching flywheel estimates...</p>
              }
              <p className="text-gray-400">Any ineligible CryptoPhunks can still be sold to the 
                <a 
                  href={`https://nftx.io/vault/0xb39185e33e8c28e0bb3dbbce24da5dea6379ae91/sell/`} 
                  target="_blank">CryptoPhunks NTFX Liquidity Pool
                </a>
              </p>
              <br/>
              <p className="text-gray-400"> v3Phunks do not have a Flywheel, but can be sold to the  
                <a 
                  href={`https://nftx.io/vault/0x4fae03385dcf5518dd43c03c2f963092c89de33c/sell/`} 
                  target="_blank">v3Phunks NTFX Vault 
                </a>
                for instant liquidity.
              </p>
            </>
            :
            null
          }
          {
            active === "withdraw" ?
            <>
              { connectedAddress === walletAddy && pendingWithdrawAmt > 0 ?
                <div className="my-2">
                  <button 
                    className="cta b-b g-bg black-txt brite"
                    onClick={() => {withdraw()}}
                  >
                    WITHDRAW {pendingWithdrawAmt}Ξ
                  </button>
                </div>
                :
                null
              }
              { connectedAddress === walletAddy && philipWithdrawAmt > 0 ?
                <div className="my-2">
                  <button 
                    className="cta b-b g-bg black-txt brite"
                    onClick={() => {withdraw()}}
                  >
                    WITHDRAW {philipWithdrawAmt}Ξ
                  </button>
                </div>
                :
                null
              }
              { connectedAddress === walletAddy && philipWithdrawAmt > 0 ?
                <div className="my-2">
                  <button 
                    className="cta b-b g-bg black-txt brite"
                    onClick={() => {withdraw()}}
                  >
                    WITHDRAW {wv1pWithdrawAmt}Ξ
                  </button>
                </div>
                :
                null 
              }
            </>
            :
            null
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