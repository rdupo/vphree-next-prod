import { React, useState, useEffect, useMemo } from 'react'
import toast, {Toaster} from 'react-hot-toast'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"
import { FaAngleDown, FaAngleUp } from "react-icons/fa6";

//components
import Header from  '../../components/Header'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import Filter from '../../components/Filter'
import History from '../../components/userHistory'

//data
import phunks from '../../utils/phunkData'
import phunkAtts from '../../utils/phunkAtts'

//internal functions and contexts
import { useWallet } from '../../contexts/WalletContext' 
import fetchNFTsForOwner from '../../hooks/alcFetchNfts'
import useWalletHistory from '../../hooks/useWalletHistory'

//contract info - collection
import philipAddy from '../../utils/philipAddy'
import philipAbi from '../../utils/philipAbi'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import phunkAddy from '../../utils/phunkAddy'
import v3PhunkAddy from '../../utils/v3PhunkAddy'
import v3PhunkAbi from '../../utils/v3PhunkAbi'

export default function WalletView() {
  //utils
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const nftbKey = process.env.NFTBANK_API_KEY
  const [walletAddy, setWalletAddy] = useState(null);
  const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>

  //states
  const [active, setActive] = useState("owned");
  const [ensAddy, setEnsAddy] = useState('')
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('');
  const [philipWithdrawAmt, setPhilipWithdrawAmt] = useState('');
  const [wv1pWithdrawAmt, setWv1pWithdrawAmt] = useState('');
  const [signer, setSigner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [v1v, setV1v] = useState(true);
  const [wv1v, setWv1v] = useState(true);
  const [v2v, setV2v] = useState(true);
  const [v3v, setV3v] = useState(true);
  
  //owned
  const [nfts, setNFTs] = useState([]);
  const [nftsData, setNFTsData] = useState([]);
  const [v1Nfts, setV1Nfts] = useState([]);
  const [wv1Nfts, setWv1Nfts] = useState([]);
  const [v2Nfts, setV2Nfts] = useState([]);
  const [v3Nfts, setV3Nfts] = useState([]);

  //activity (only fetched once the Activity tab is opened)
  const { transactionHistory } = useWalletHistory(active === 'activity' ? walletAddy : null);

  /* --- START HANDLE COLLECTION STATE CHANGE --- */
  const collUpdate = (x) => {
    setActive((prevValue) => (x));
    if (x === 'owned' && nfts.length > 0) {
      setLoading(false)
    } else {
      setLoading(true);
    }
  }
  /* --- END HANDLE COLLECTION STATE CHANGE --- */

  //get wallet address from url
  useEffect(() => {
    if (router.isReady) {
      setWalletAddy(router.query.addy);
    }
  }, [router.isReady, router.query.addy]);

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

  /* --- START FETCHING OWNED NFTS --- */
    const getNfts = async () => {
      if (walletAddy) {        
        console.log('addy', walletAddy);
        const data = await fetchNFTsForOwner(walletAddy);
        const dataIds = data.map(item => Number(item.tokenId));
        setNFTs(dataIds); //ids of phunks owned accross collections
        console.log(data)
        const ownedNfts = phunks.filter(item => dataIds.includes(item.tokenId));
        setNFTsData(ownedNfts); //full metadata for owned phunks across collections

        //parse owned by collection; IDs only (numeric)
        const v1 = data
          .filter(item => item.contract.address.toLowerCase() === "0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce")
          .map(item => Number(item.tokenId))
        const wv1 = data
          .filter(item => item.contract.address.toLowerCase() === "0x235d49774139c218034c0571ba8f717773edd923")
          .map(item => Number(item.tokenId))
           console.log(wv1)
        const v2 = data
          .filter(item => item.contract.address.toLowerCase() === "0xf07468ead8cf26c752c676e43c814fee9c8cf402")
          .map(item => Number(item.tokenId))
        const v3 = data
          .filter(item => item.contract.address.toLowerCase() === "0xb7d405bee01c70a9577316c1b9c2505f146e8842")
          .map(item => Number(item.tokenId))

        setV1Nfts(v1);
        setWv1Nfts(wv1);
        setV2Nfts(v2);
        setV3Nfts(v3);
        setLoading(false);
      }
    };

    useEffect(() => {getNfts()},[walletAddy]);
  /* --- END FETCHING OWNED NFTS --- */

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
          <div className="picker-div divide-x-2 divide-white text-white pt-[2em]">
            <p 
              className={`picker pr-4 text-xl cursor-pointer ${active=== 'owned' ? 'drk-grey-txt' : ''}`}
              onClick={() => collUpdate('owned')}>Owned Phunks
            </p>
            {/*<p 
              className={`picker mt-6 px-4 text-xl cursor-pointer ${active === 'offers' ? 'g-txt' : ''}`}
              onClick={() => collUpdate('offers')}>Active Offers
            </p>
            <p 
              className={`picker mt-6 px-4 text-xl cursor-pointer ${active === 'activity' ? 'g-txt' : ''}`}
              onClick={() => collUpdate('activity')}>Activity
            </p>*/}
          </div>
          <h1 className="g-txt mr-auto text-5xl mb-8">
            {/*<span>
            Wallet:
            </span>*/}
            <a 
              href={`https://etherscan.io/address/${walletAddy}`}
              target="_blank"
            >
              {ensAddy && ensAddy.length > 4 ? 
                ensAddy : 
                (walletAddy ? 
                    walletAddy.substr(0, 4) + 
                    "..." + 
                    walletAddy.substr(walletAddy.length - 4) 
                    : ""
                )
              }
            </a>
          </h1>           
          {
            active === "owned" ?
            <>              
              {
                loading  ?
                <p className="text-2xl">Loading Phunks...</p>
                :                
                (
                  v1Nfts.length > 0 ?
                  <>
                    <div className="block">
                      <h2 className="text-2xl cursor-pointer mb-2 inline" onClick={() => setV1v(!v1v)}>Philips</h2>
                      <FaAngleDown className={v1v ? `inline m-1 pb-1` : `hidden`}/>
                      <FaAngleUp className={!v1v ? `inline m-1 pb-1` : `hidden`}/>
                    </div>                    
                    {v1v && <Filter
                      phunks={phunks.filter(item => v1Nfts.includes(item.tokenId))}
                      coll="philip"
                    />}
                  </>
                  :
                  null
                )
              }              
              {
                loading  ?
                null
                :
                (
                  wv1Nfts.length > 0 ?
                  <>
                    <div className="block">
                      <h2 className="inline text-2xl cursor-pointer mb-2" onClick={() => setWv1v(!wv1v)}>Wrapped v1s</h2>
                      <FaAngleDown className={wv1v ? `inline m-1 pb-1` : `hidden`}/>
                      <FaAngleUp className={!wv1v ? `inline m-1 pb-1` : `hidden`}/>
                    </div>
                    {wv1v && <Filter
                      phunks={phunks.filter(item => wv1Nfts.includes(item.tokenId))}
                      coll="v1"
                    />}
                  </>
                  :
                  null
                )
              }
              {
                loading  ?
                null
                :
                (
                  v2Nfts.length > 0 ?
                  <>
                    <div className="block">
                      <h2 className="inline text-2xl cursor-pointer mb-2" onClick={() => setV2v(!v2v)}>CryptoPhunks</h2>
                      <FaAngleDown className={v2v ? `inline m-1 pb-1` : `hidden`}/>
                      <FaAngleUp className={!v2v ? `inline m-1 pb-1` : `hidden`}/>
                    </div>
                    {v2v && <Filter
                      phunks={phunks.filter(item => v2Nfts.includes(item.tokenId))}
                      coll="v2"
                    />}
                  </>
                  :
                  null
                )
              }
              {
                loading  ?
                null
                :
                (
                  v3Nfts.length > 0 ?
                  <>
                    <div className="block">
                      <h2 className="inline text-2xl cursor-pointer mb-2" onClick={() => setV3v(!v3v)}>v3 Phunks</h2>
                      <FaAngleDown className={v3v ? `inline m-1 pb-1` : `hidden`}/>
                      <FaAngleUp className={!v3v ? `inline m-1 pb-1` : `hidden`}/>
                    </div>
                    {v3v && <Filter
                      phunks={phunks.filter(item => v3Nfts.includes(item.tokenId))}
                      coll="v3"
                    />}
                  </>
                  :
                  null
                )
              }
            </>
            :
            null
          }
          {
            active === "offers" ?
            <>
              <h2 className="text-2xl"> Active Offers</h2>
              <p className="text-2xl text-gray-400 my-4">Coming soon.</p>
            </>
            :
            null
          }
          {
            active === "activity" ?
            <>
              <h2 className="text-2xl">Trade History</h2>
              <History transactions={transactionHistory} mp="marketplace"/>
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