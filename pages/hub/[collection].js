import { React, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import DashCard from '../../components/dashCard'
import Card from '../../components/Card'
import StaticCard from '../../components/StaticCard'
import FlywheelCard from '../../components/flywheelCard'
import LatestProp from '../../components/LatestProp'
import History from '../../components/userHistory'
import Footer from '../../components/Footer'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"
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
import phunkAddy from '../../utils/phunkAddy'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkData'
import phunkAtts from '../../utils/phunkAtts' 
import AuctionTimer from '../../components/auctionTimer'
import getV3Sales from '../../hooks/v3Sales'
import getNllSales from '../../hooks/nllSales'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import philipAbi from '../../utils/philipAbi'
import xferAbi from '../../utils/xferAbi'
import philipAddy from '../../utils/philipAddy'
import getFlywheelBuys from '../../hooks/FlywheelBuys'
import SaleCard from '../../components/SaleCard'

export default function PhunkyHub() {
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const nftbKey = process.env.NFTBANK_API_KEY
  const { sales } = getV3Sales();
  const { nllSales } = getNllSales();
  const { flywheelSales } = getFlywheelBuys();
  const [iWidth, setIWidth] = useState(getInitialWidth());
  const coll = router.query.collection
  const [ensAddy, setEnsAddy] = useState('')
  const [nfts, setNFTs] = useState([]);
  const [nftsData, setNFTsData] = useState([]);
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('')
  const marketContract = v3MarketAddy
  const marketAbi = v3MarketAbi
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [signer, setSigner] = useState([]);
  const contract = new ethers.Contract(marketContract, marketAbi, provider);
  const v3Contract = new ethers.Contract(v3PhunkAddy, v3PhunkAbi, provider);
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(true);
   
  //collection displayed
  const [activeCollection, setActiveCollection] = useState(coll);
  
  //auction
  const aucContract = new ethers.Contract(auctionAddy, auctionAbi, provider);
  const [aucData, setAucData] = useState([]);
  const [bidInc, setBidInc] = useState();
  const [aucBidder, setAucBidder] = useState();
  const [aucEvent, setAucEvent] = useState([]);
  
  //flywheel
  const flywheelContract = new ethers.Contract(flywheelAddy, flywheelAbi, provider);
  const [nftEstimate, setNftEstimate] = useState([]);
  const [minFlywheelPrice, setMinFlywheelPrice] = useState();
  const [flywheelLoading, setFlywheelLoading] = useState(true);
  const [flywheelId, setFlywheelId] = useState("0");
  const [flywheelBalance, setFlywheelBalance] = useState("---")

  //philip wrapper
  const [wrapId, setWrapId] = useState(-1);
  const [wError, setWError] = useState('none');
  const [wrapBtnClass, setWrapBtnClass] = useState('hidden');
  const [wrapBtnText, setWrapBtnText] = useState('');

  //sales card div bg
  let cardBg;

  if(activeCollection === 'v3phunks') {
    cardBg = 'flex flex-wrap justify-center bg-[#83dfb2]'
  } else {
    cardBg = 'flex flex-wrap justify-center bg-[#648596]'
  }

  //start flywheel js ---------
  const getBalance = async () => {
    const bal = await provider.getBalance(flywheelAddy);
    const ethBal = Number(ethers.utils.formatUnits(bal._hex,18)).toFixed(2);
    setFlywheelBalance(ethBal);
  }

  const getValue = async (phunk) => {
    const temp = [];
    const percentOfValue = await flywheelContract.contractConfig();
    const pct = Number(ethers.utils.formatUnits(percentOfValue.pctOfOraclePriceEstimateToPay._hex,2));

    const res = await fetch(`/api/priceEstimate/${phunkAddy}/${phunk}`);
    const data = await res.json();
    const dispEst = Number(data.data.estimate.eth)*pct;
    const nftb = Number(data.data.estimate.eth);
    temp.push({
      tokenId:phunk,
      payout: dispEst.toFixed(3),
      nftbEst: nftb
    });

    setNftEstimate(temp);
    console.log("flywheel:", temp);

    const minValue = await flywheelContract.getCurrentMinimumValidPrice();
    const minValidPrice = Number(ethers.utils.formatUnits(minValue[0]._hex,18));
    setMinFlywheelPrice(minValidPrice);

    setFlywheelLoading(false);
  }
  //end flywheel js -----------

  //start auction js ----------
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
        //console.log("Auction Event:", event);
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
  //end auction js ------------

  //start width js ------------
  function getInitialWidth() {
    if(typeof(window) !== 'undefined') {
      return parseInt(((window.innerWidth)) / 70) >= 20
        ? 20
        : parseInt(((window.innerWidth)) / 70);
    }
  }

  useEffect(() => {
    // Update iWidth on window resize
    const handleResize = () => {
      setIWidth(getInitialWidth());
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  //end width js -------------

  const collUpdate = (x) => {
    setActiveCollection((prevValue) => (x));
    setLoading(true);
    setBidLoading(true);
  }

  if(typeof(router.query.addy) !== 'undefined'){
    sessionStorage.setItem('dashAddy', router.query.addy);
  }

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

  /* ---- START WRAPPER FUNC ---- */
  async function loadV1() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const wc = new ethers.Contract(wrapperAddy, wrapperAbi, signer);

    try {
        const w = await wc.canBeWrappedByUser(signer._address, wrapId);

        if (w) {
            setWrapBtnText("Wrap Philip");
            setWrapBtnClass("black-bg g-txt w-[144px] g-b p-1 brite my-2");
            return;  // Exit early if this condition is met
        }
    } catch (error) {
        console.log("Error checking canBeWrappedByUser:", error.message);
    }

    try {
        const u = await wc.canBeUnwrappedByUser(signer._address, wrapId);

        if (u) {
            setWrapBtnText("Unwrap v1");
            setWrapBtnClass("black-bg g-txt w-[144px] g-b p-1 brite my-2");
            return;  // Exit early if this condition is met
        }
    } catch (error) {
        console.log("Error checking canBeUnwrappedByUser:", error.message);
    }

    setWError('generic');  // This is reached only if both conditions fail
  }

  async function wrapPhilip() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const pc = new ethers.Contract(philipAddy, xferAbi, signer);
    const wc = new ethers.Contract(wrapperAddy, wrapperAbi, signer);
    
    try{
      const w = await wc.canBeWrappedByUser(signer._address, wrapId);

      if(w) {
      const xferPromise = pc.safeTransferFrom(signer._address, wrapperAddy, wrapId);
      txnToast(xferPromise, `Wrapping Philip #${wrapId}`); 
      await xferPromise
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
      } else { setWError('own'); }
    } catch(error){
      if(error.message.search('nonexistent token') >= 0) {
        setWError('exist')
      }
      if (error.message.search('rejected') >= 0) {
        setWError('reject')
      }
    }
  }
  
async function unwrapPhilip() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const wc = new ethers.Contract(wrapperAddy, wrapperAbi, signer);
    
    try{
      const u = await wc.canBeUnwrappedByUser(signer._address, wrapId);
      if (u) {
        const xferPromise = wc.unwrap(wrapId);
        txnToast(xferPromise, `Unwrapping Philip #${wrapId}`); 
        await xferPromise
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
      } else { setWError('own'); }
    } catch(error){
      if(error.message.search('nonexistent token') >= 0) {
        setWError('exist')
      }
      if (error.message.search('rejected') >= 0) {
        setWError('reject')
      }
    }
  }

  /* ---- END WRAPPER FUNC ---- */

  useEffect(() => {
    curAuc();
    getBalance();
  },[aucEvent])

  useEffect(() => {
    setActiveCollection(coll);
  }, [coll]);

  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <div className="hub-picker-div divide-x-2 divide-gray-500 text-gray-500">
            <p 
              className={`hub-picker mt-6 pr-4 text-3xl cursor-pointer ${activeCollection === 'philip-intern-project' ? 'text-[#a79aff]' : ''}`}
              onClick={() => Router.push({ pathname: `/hub/philip-intern-project` })}
              >Philips</p>
            <p 
              className={`hub-picker mt-6 px-4 text-3xl cursor-pointer ${activeCollection === 'cryptophunks' ? 'text-[#75a8c2]' : ''}`}
              onClick={() => Router.push({ pathname: `/hub/cryptophunks` })}>CryptoPhunks</p>
            <p 
              className={`hub-picker mt-6 px-4 text-3xl cursor-pointer ${activeCollection === 'v3phunks' ? 'text-[#83dfb2]' : ''}`}
              onClick={() => Router.push({ pathname: `/hub/v3phunks` })}>v3Phunks</p>
          </div>
          {activeCollection === 'philip-intern-project' ?
            <>
            <div className="mt-8 w-full">
              <Link href="/collections/philip-intern-project">
                <button className="mobile-100 cta v1-b v1-bg black-txt w-[345px]">Philip Marketplace</button>
              </Link>
              <Link href="/view-all/philip-intern-project">
                <button className="mobile-100 cta v1-b black-bg v1-txt w-[315px]">Philip Phinder</button>
              </Link>
            </div>
            <div className="mt-2 w-full">
              <Link href="/collections/wrapped-v1-phunks">
                <button className="mobile-100 cta v1-b v1-bg black-txt w-[345px]">Wrapped v1 Marketplace</button>
              </Link>
              <Link href="/view-all/wrapped-v1-phunks">
                <button className="mobile-100 cta v1-b black-bg v1-txt w-[315px]">View All Wrapped v1s</button>
              </Link>
            </div>
            </>
            :
            null
          }
          {activeCollection === 'cryptophunks' ?
            <div className="mt-8 w-full">
              <Link href="/view-all/cryptophunks">
                <button className="mobile-100 cta v2-b v2-bg black-txt">View All CryptoPhunks</button>
              </Link>
            </div>
            :
            null
          }
          {activeCollection === 'v3phunks' ?
            <div className="mt-8 w-full">
            <Link href="/collections/v3-phunks">
              <button className="mobile-100 cta v3-bg border-[#83dfb2] border-[3px] black-txt">v3 Marketplace</button>
            </Link>
            <Link href="/view-all/v3-phunks">
              <button className="mobile-100 cta border-[#83dfb2] border-[3px] black-bg text-[#83dfb2]">View All v3s</button>
            </Link>
            </div>
            :
            null
          }
          <h2 className="mt-16 mb-4 text-2xl">About</h2>
          {activeCollection === 'philip-intern-project' ?
            <div className="text-gray-300 w-11/12 filter-sort-wrapper">
              <p>Philip Intern Project is a collection of 1,004 Phunks minted from the original CryptoPhunks contract, deployed June 14, 2021. A week later the team deployed the v2 contract to remove the bonding curve pricing built into the original contract. It was at this time that the Philips&apos; metadata was wiped and the images were updated to &#34;Philip the Intern&#34; for all 1,004 NFTs.</p>
              <br/>
              <p>In February 2022 a wrapper for Philips was deployed, which restores the metadata and updates the image to the corresponding Phunk on a purple background. Once your Philip is wrapped, you will receive your v1 Phunks (Wrapped) NFT and the Philip will be sent to the V1 Cryptopunks (Wrapped) contract.</p>
            </div>
            :
            null
          }
          {activeCollection === 'cryptophunks' ?
            <div className="text-gray-300 w-11/12 filter-sort-wrapper">
              <p>The crown jewel of the Phunk ecosystem, CryptoPhunks are the full 10,000 flipped CryptoPunks minted off the v2 contract, which the anonymous dev team deployed in order to shed the bond curve pricing from the initial (Philip Intern Project) contract.</p>
              <br/>
              <p>The collection was delisted from OpenSea multiple times. After the first occurrence on June 20, 2021, the dev team added borders and changed the name to &#34;Not Punks&#34;. That worked for a whopping nine days, at which point OpenSea delisted the collection again. After facing backlash, OpenSea finally re-listed the collection on July 3, 2021. Ten days later both OpenSea and the dev team received a DMCA from Larva Labs, creators of CryptoPunks. This led to the third delisting on OpenSea, and first on Rarible (despite the fact they never received a DMCA).</p>
              <br/>
              <p>Unwilling to counter the DMCA, the team decided to abandon the project, taking all the funds and dev Phunks with them. Rather than allow the project to die, members of the community banded together to give it new life. In November 2021, NotLarvaLabs was launched, which allowed the community to buy and sell their Phunks fee- and censorship-free.</p>
              <br/>
              <p>In May 2022, members of the community were able to identify the CryptoPhunks creator and convinced them to return the CryptoPhunks v1 and v2 contracts, 490 CryptoPhunks, and 503 Philips (v1 CryptoPhunks) back to the community. Since then, CryptoPhunks have not only been relisted on OpenSea, but are now a Verified project. The community has continued the tradition of building open-source tools to further the space, including: Phunks Knowledge Base, Auction House, Flywheel, Community-owned Verification and Treasury voting system, and more.</p>
            </div>
            :
            null
          }
          {activeCollection === 'v3phunks' ?
            <div className="text-gray-300 w-11/12 filter-sort-wrapper">
              <p>The philanthropic arm of the Phunks, v3Phunks launched in August 2022 to address the market&apos;s desire for a more affordable entrypoint to the Phunk ecosystem. The v3Phunks launched at just 0.005Ξ each. Rather than keep the money for themselves, the community members involved in creating the project decided to donate 100% of the proceeds to mental health organization MAPS. The project was a huge success, with collectors minting the project out directly from the contact in mere hours–before a mint site could even be put up. In total the v3Phunks donated approximately $75,000 USD to MAPS.</p>
              <br/>
              <p>As with the CryptoPhunks before them, v3s also faced some controversy, as numerous individuals attempted to discredit the project, claiming the money was never donated. OpenSea even snubbed the project when highlighting charitable projects on their homepage. All this, despite confirmation directly from both MAPS and Change.org (in addition to being totally verifiable on-chain).</p>
            </div>
            :
            null
          }
          {activeCollection === 'philip-intern-project' ? null : <h2 className="mt-16 mb-4 text-2xl">Recent Sales</h2>}
          <div className={cardBg}>
            {activeCollection === 'v3phunks' ?
              (sales.slice(0, iWidth-1).map((sale) => (
                sales.length > 0 ? 
                  (<SaleCard
                    key={sale.id}
                    price={sale.price + "Ξ"}
                    atts=""
                    id={sale.id}
                    coll="v3"
                  />) 
                : 
                  null
              )))
              :
            null}
            {activeCollection === 'cryptophunks' ?
              (nllSales.slice(0, iWidth-1).map((sale) => (
                nllSales.length > 0 ? 
                  (<SaleCard
                    key={sale.id}
                    price={sale.price + "Ξ"}
                    atts=""
                    id={sale.id}
                    coll="v2"
                  />) 
                : 
                  null
              )))
              :
            null}
          </div> 

{/* --- START WRAPPER ---- */}  
          {activeCollection !== 'philip-intern-project' ? null :
            <div>
              <h2 className="mt-16 mb-4 text-2xl">Philip Wrapper</h2>
              <div className="inline-flex">
                <div>
                  <StaticCard
                    key={`wrap${wrapId}`}
                    price=""
                    coll="v1"
                    atts=""
                    id={ wrapId === "" ? -1 : wrapId}
                  />
                </div>
                <div className="align-top mx-4">
                  <div>
                  <input
                      className="bg-green-100 p-1 black-txt w-[144px]" 
                      type="text" 
                      name="wrap-id" 
                      placeholder="PHILIP ID"
                      id="wrap-id-value"
                      minLength="1" 
                      maxLength="4" 
                      onChange={(e) => {setWrapId(e.target.value);setWError('none'); setWrapBtnClass('hidden')}}
                    />
                    </div>
                    {connectedAddress.length > 4 ? 
                      <div>
                        <p
                          className="underline v1-txt cursor-pointer my-2"
                          onClick={() => {loadV1()}}
                        >
                          Load v1 Phunk
                        </p>
                        <button 
                          className={wrapBtnText === "Wrap Philip" ? wrapBtnClass : "hidden"} 
                          onClick={() => {wrapPhilip()}}
                          id="search-btn">{wrapBtnText}
                        </button>
                        <button 
                          className={wrapBtnText === "Unwrap v1" ? wrapBtnClass : "hidden"} 
                          onClick={() => {unwrapPhilip()}}
                          id="search-btn">{wrapBtnText}
                        </button>
                        <p className={`text-red-500 ${wError === 'exist' ? '' : 'hidden'}`}>This Philip does not exist</p>
                        <p className={`text-red-500 ${wError === 'own' ? '' : 'hidden'}`}>You cannot wrap this Philip</p>
                        <p className={`text-red-500 ${wError === 'reject' ? '' : 'hidden'}`}>User rejected transaction</p>
                        <p className={`text-red-500 ${wError === 'generic' ? '' : 'hidden'}`}>You do not own this v1 or it does not exist</p>
                      </div>
                      :
                      <div 
                        className="p-3 black-bg g-txt g-b w-auto my-2"  
                        id="not-connected">
                          Please connect your wallet to use wrapper
                      </div> 
                    }
                  </div>
              </div>
            </div>
          }
{/* --- END WRAPPER ---- */}  

          {activeCollection === 'cryptophunks' ? <h2 className="mt-16 mb-4 text-2xl">Current Auction</h2> : null }
          {activeCollection === 'cryptophunks' ? 
            aucData.length > 0 ? 
              <AuctionTimer
                targetDate={Number(ethers.utils.formatUnits(aucData.endTime._hex,0))*1000}
                id={ethers.utils.formatUnits(aucData.phunkId._hex,0)}
                bidder={aucBidder}
                highBid={ethers.utils.formatUnits(aucData.amount._hex,18)}
                bidPercent={bidInc}
              />
              :
              <p className="text-2xl g-txt my-4">Loading current auction...</p>
            :
            null
          }
          {activeCollection === 'v3phunks' ?
            <> 
              <h2 className="mt-16 mb-4 text-2xl">Instant Liquidity</h2>
              <p className="text-gray-400"> Sell to the 
                <a 
                  href={`https://nftx.io/vault/0x4fae03385dcf5518dd43c03c2f963092c89de33c/sell/`} 
                  target="_blank"> NTFX Liquidity Pool
                </a>
              </p>
            </> 
            : 
            null
          }
          {activeCollection === 'cryptophunks' ?
            <>
              <h2 className="mt-16 mb-4 text-2xl">Flywheel</h2>
              <div className="inline-block mb-0 w-1/2 mobile-100 align-top"> 
                <h2 className="text-gray-400">Flywheel Payout Checker</h2>
                  {nftEstimate.length > 0 ?
                    nftEstimate.map((phunk) => (
                      <FlywheelCard
                        key={`flywheel${phunk}`}
                        price={phunk.payout}
                        est={phunk.nftbEst}
                        minPrice={minFlywheelPrice}
                        atts=""
                        id={phunk.tokenId}
                      />
                    ))
                    :
                    <FlywheelCard
                      key={`flywheel-1`}
                      price=""
                      est=""
                      minPrice=""
                      atts=""
                      id="-1"
                    />
                  }
                <div className="w-1/2 ml-8 h-12 inline-block align-top">
                  <input
                    className="bg-green-100 w-full p-1 black-txt" 
                    type="number" 
                    name="lookup-id" 
                    placeholder="PHUNK ID"
                    id="lookup-id-value"
                    minLength="1" 
                    maxLength="4" 
                    onChange={(e) => setFlywheelId(e.target.value)}
                  />
                  <button 
                    className="black-bg g-txt g-b w-full p-1 brite my-2" 
                    onClick={() => {getValue(flywheelId)}}
                    id="search-btn">CHECK PAYOUT
                  </button>
                  <p className="mb-2 filter-sort-wrapper"> Flywheel Funds: {flywheelBalance}Ξ</p>
                </div>
              </div>
              <div className="w-1/2 inline-block mobile-100 align-top">
                <h2 className="text-gray-400">Recent Flywheel Buys</h2>
                {flywheelSales.length > 0 ?
                  flywheelSales.map((sale) => {
                    return(              
                      <div className='img-wrapper v2-bg inline-block' key={`flywheel-${sale.id}`}>
                        <Image
                          className="w-100 inline-block"
                          src={`/phunks/phunk${sale.id}.svg`}
                          loading="lazy"
                          alt={`phunk ${sale.id}`}
                          height="50"
                          width="50"
                        />
                      </div>
                    )
                  })
                  :
                  <p className="text-2xl g-txt my-4">Loading recent Flywheel buys...</p>
                }
              </div>
              <p className="text-gray-400 mt-2">Any ineligible Phunks can still be sold to the 
                <a 
                  href={`https://nftx.io/vault/0xb39185e33e8c28e0bb3dbbce24da5dea6379ae91/sell/`} 
                  target="_blank"> NTFX Liquidity Pool
                </a>
              </p>
            </>
            :
            null
          }
          {activeCollection === 'cryptophunks' ? <LatestProp/> : null}
          <h2 className="mt-16 mb-4 text-2xl">Links</h2>
          {activeCollection === 'philip-intern-project' ? 
            <div>
              <h3 className="">Marketplace</h3>
              <p className="text-gray-400">vPhree (you are here)</p>
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
            activeCollection === 'cryptophunks' ?
            <div>
              <h3 className="">Vote!</h3>
              <p><a target="_blank" href="https://phunk.cc/">Treasury Prop Voting</a></p>

              <h3 className="mt-4">Marketplace</h3>
              <p><a target="_blank" href="https://notlarvalabs.com/cryptophunks/forsale">Not Larva Labs</a></p>
              <p><a target="_blank" href="https://pro.opensea.io/collection/crypto-phunks">OpenSea Pro</a></p>

              <h3 className="mt-4">Contracts</h3>
              <p><a target="_blank" href="https://etherscan.io/address/0xf07468ead8cf26c752c676e43c814fee9c8cf402">CryptoPhunks Contract</a></p>
              <p><a target="_blank" href="https://etherscan.io/address/0xd6c037bE7FA60587e174db7A6710f7635d2971e7">NotLarvaLabs Contract</a></p>
              <p><a target="_blank" href="https://etherscan.io/address/0x86b525ab8c5c9b8852f3a1bc79376335bcd2f962">Flywheel Contract</a></p>
              <p><a target="_blank" href="https://etherscan.io/address/0x0E7f7d8007C0FCcAc2a813a25f205b9030697856">Auction House Contract</a></p>

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
              <h3 className="">Marketplaces</h3>
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