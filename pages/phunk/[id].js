import { React, useState, useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Footer from '../../components/Footer'
import History from '../../components/History_qBC'
import getTxnHistory from '../../hooks/TxnHistory_OG'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from 'ethers'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkAtts'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import v3PhunkAddy from '../../utils/v3PhunkAddy'
import v3PhunkAbi from '../../utils/v3PhunkAbi'

export default function V3Phunks() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const router = useRouter()
  const id = router.query.id
  const atts = phunks[id]
  const collectionContract = v3PhunkAddy
  const marketContract = v3MarketAddy
  const v3Abi = v3PhunkAbi
  const marketAbi = v3MarketAbi
  const [listed, setListed] = useState([]);
  const [offers, setOffers] = useState('');
  const [offerer, setOfferer] = useState('');
  const { connectedAddress, setConnectedAddress } = useWallet();
  //console.log("connected: ", connectedAddress)
  const [owner, setOwner] = useState('');
  const [bidActive, setBidState] = useState(false);
  const [listActive, setListState] = useState(false);
  const { transactionHistory } = getTxnHistory(id);
  const [listPrice, setListPrice] = useState('');
  const [bid, setBid] = useState('');
  const provider = new ethers.providers.AlchemyProvider('homestead', alcKey);
  const [signer, setSigner] = useState([]);
  let alt_id

  if(id) {
    const s_id = id.toString();

    if (s_id.length === 1) {
      alt_id = "000"+s_id
    } else if (s_id.length === 2) {
      alt_id = "00"+s_id
    } else if (s_id.length === 3) {
      alt_id = "0"+s_id
    } else {
      alt_id = s_id
    }   
  } else {
    alt_id = "0000"
  }

  //toggle class
  const bidToggle = () => {
    setBidState((current) => !current)
  }

  const listToggle = () => {
    setListState((current) => !current)
  }

  //get listing info and bid info, if they exist
  const fetchDataWithRetry = async () => {
    const maxRetries = 5;
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
          const v3 = new ethers.Contract(collectionContract, v3Abi, provider);
          const market = new ethers.Contract(marketContract, marketAbi, provider);
        try {
          const o = await v3.ownerOf(id).then(new Response);
          setOwner(o);
          //console.log("owner: ", owner)
        } catch (error) {  }

        try {
          const listing = await market.phunksOfferedForSale(id);
          setListed(listing);
        } catch (error) {  }

        try {
          const bids = await market.phunkBids(id);
          const topBid = bids.value;
          if (topBid > 0) {
            setOffers(topBid);
            setOfferer(bids.bidder);
            //console.log("bid from: ", offerer, "; connected: ", connectedAddress);
          }
        } catch (error) {  }

        success = true; // Data fetched successfully
      } catch (error) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before retrying
      }
    }

    if (!success) {
      // Handle the case where data couldn't be fetched after maximum retries
      console.error('Failed to fetch data after maximum retries.');
    }
  }

  useEffect(() => {
    fetchDataWithRetry();
    const storedAddress = localStorage.getItem('connectedAddress');
    if (storedAddress && connectedAddress !== storedAddress) {
      setConnectedAddress(storedAddress);
    }
  }, [id,connectedAddress, setConnectedAddress]);

  const txnToast = (x) => {
    if (!(x instanceof Promise)) {
      // If x is not a promise, you can handle it here
      console.error('txnToast error: x is not a promise');
      return;
    }

    toast.promise(x, {
      loading: 'Transaction pending...',
      success: 'Transaction successful!',
      error: 'Transaction failed!',
      position: 'top-center',
    },
    {
      style: {
        minWidth: '80%',
        color: '#83dfb2',
        background: '#000',
      },
    });
  };

  async function listPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const cc = new ethers.Contract(collectionContract, v3Abi, signer);
    const ap = await cc.isApprovedForAll(connectedAddress, marketContract);
    if (ap) {
      const lPrice = ethers.utils.parseUnits(listPrice, 'ether');
      const listPromise = cpmp.offerPhunkForSale(id, lPrice);
      txnToast(listPromise);
      setListState(false);
      await listPromise
        .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()
        })
      });
    } else {
      const setApproval = cc.setApprovalForAll(marketContract, true);
      txnToast(setApproval);
      await setApproval.wait();
      const lPrice = ethers.utils.parseUnits(listPrice, 'ether');
      const listPromise = cpmp.offerPhunkForSale(id, lPrice);
      txnToast(listPromise);
      setListState(false);
      await listPromise
        .then(result => {
          const rh = result.hash
          mmp.waitForTransaction(rh).then(() => {
            fetchDataWithRetry()
          })
        });
    };
  }

  async function delistPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const delistPromise = cpmp.phunkNoLongerForSale(id);
    txnToast(delistPromise); 
    await delistPromise
      .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()
        })
      });
  }

  async function acceptPhunkBid() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const cc = new ethers.Contract(collectionContract, v3Abi, signer);
    const ap = await cc.isApprovedForAll(connectedAddress, marketContract);
    const c = await cpmp.phunkBids(id).then(new Response);
    const bidPrice = c.value._hex;
    if(ap) {
      const acceptBidPromise = cpmp.acceptBidForPhunk(id, bidPrice);
      txnToast(acceptBidPromise);
      await acceptBidPromise
        .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()
        })
      });
    } else {
      const setApproval = cc.setApprovalForAll(marketContract, true);
      txnToast(setApproval); 
      await setApproval.wait();
      const acceptBidPromise = cpmp.acceptBidForPhunk(id, bidPrice);
      txnToast(acceptBidPromise);
      await acceptBidPromise
        .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()
        })
      });      
    }
  }

  async function buyPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    //console.log("buy signer: ", signer)
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const buyPhunkPromise = cpmp.connect(signer).buyPhunk(id, {value: listed.minValue._hex});
    txnToast(buyPhunkPromise);
    await buyPhunkPromise
      .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()
        })
      });
  }

  async function bidOnPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const ethBid = ethers.utils.parseUnits(bid, 'ether');
    const enterBidPromise = cpmp.enterBidForPhunk(id, {value: ethBid});
    txnToast(enterBidPromise);
    setBidState(false);
    await enterBidPromise
      .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          fetchDataWithRetry()          
        })
      });
  }

  async function cancelPhunkBid() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const withdrawBidPromise = cpmp.withdrawBidForPhunk(id);
    txnToast(withdrawBidPromise);  
    await withdrawBidPromise
      .then(result => {
        const rh = result.hash
        mmp.waitForTransaction(rh).then(() => {
          //fetchDataWithRetry()
          Router.reload()
        })
      });
  }

  // onClick functions
  // list
  async function list() {
    if(signer) {
      listPhunk()
    }
  }

  // delist
  async function delist() {
    if(signer) {
      delistPhunk()
    }
  }

  // accept bid
  async function acceptBid() {
    if(signer) {
      acceptPhunkBid()
    }
  }

  // buy
  async function buy() {
    //console.log('signer: ', signer)
    if(signer){
      buyPhunk()
    }
  }

  // place bid
  async function bidOn() {
    if(signer) {
      bidOnPhunk()
    }
  }

  // cancel bid
  async function cancelBid() {
    if(signer) {
      cancelPhunkBid()
    }
  }
  
  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page">
        <div className="content px-8">
          <div className="row-wrapper block px-0 my-4">
            <div className="nft-info inline-block pl-0 align-top v3-bg w-full">
              <div id="img-wrapper">
                <Image
                  src={`/phunks/phunk${alt_id}.svg`}
                  alt={`image of phunk ${id}`}
                  width={500}
                  height={500}
                />
              </div>
            </div>
            <h2 id="title" className="v3-txt mb-3">v3phunk #{id}</h2>
            <div className="metadata inline-block align-top w-full md:w-3/12">
              <div className="id-and-owner">
                <p>Owner</p>
                <div 
                  id="owner" 
                  className="collection-desc brite v3-txt sans-underline"
                  onClick={() => {connectedAddress.toLowerCase() === owner.toLowerCase() ?
                                  Router.push({pathname: `/account/${owner}`}) :
                                  Router.push({pathname: `/profile/${owner}`})}}>
                  {owner.substr(0,4) + `...` + owner.substr(owner.length-4, owner.length)}
                </div>
              </div>
            </div>
            <div className="metadata inline-block align-top w-full md:w-5/12">
              <p>Attributes</p>
              <div className="metadata" id="md">
                <div className="collection-desc v3-txt my-1" dangerouslySetInnerHTML={{ __html: atts}} />
              </div>
            </div>
            <div className="contract-interactions inline-block pr-0 align-top w-full md:w-4/12">
              <div className="price-and-bid">
                {!listed.isForSale ?
                  null
                  :
                  <p id="price">Price:&nbsp;
                    <span className="collection-desc v3-txt">
                      {ethers.utils.formatUnits(listed.minValue._hex,18) + 'Ξ'}
                    </span>
                  </p>
                }
                {offers.length === 0 ?
                  null
                  :
                  <>
                    <p id="bid" className="">Top Bid:&nbsp;
                      <span className="collection-desc v3-txt">{ethers.utils.formatUnits(offers._hex,18) + 'Ξ'}</span>
                    </p>
                    <p className="">Bidder:&nbsp; 
                      <span 
                        id="top-bidder"
                        className="collection-desc brite v3-txt sans-underline"
                        onClick={() => {connectedAddress === offerer ?
                                        Router.push({pathname: `/account/${offerer}`}) :
                                        Router.push({pathname: `/profile/${offerer}`})}}
                      >
                          {offerer.substr(0,4) + `...` + offerer.substr(offerer.length-4, offerer.length)}
                      </span>
                    </p>
                  </>
                }
              </div>
              {connectedAddress.length > 0 ?
                <div> 
                  {connectedAddress.toLowerCase() !== owner.toLowerCase() ?
                    <div className="" id="buy-bid-buttons">
                      {!listed.isForSale ?
                        null
                        :
                        <><button 
                          className="v3-bg black-txt w-full p-1 my-2 brite" 
                          onClick={() => {buy()}}
                          id="buy-btn">BUY</button><br/></>
                      }
                      <button 
                        className="v3-bg black-txt w-full p-1 my-2 brite" 
                        onClick={bidToggle}
                        id="bid-btn-togl">BID
                      </button>
                      <br/>
                      <div className={bidActive ? '' : 'hidden'} id="enter-bid-amount">
                        <input
                          className="lite-v3-bg w-full p-1 my-2 black-txt" 
                          type="number" 
                          name="bid-amt" 
                          placeholder="bid amount"
                          min="0"
                          id="bid-amt"
                          onChange={(e) => setBid(e.target.value )}
                        />
                        <br/>
                        <button 
                          className="black-bg v3-txt v3-b w-full p-1 my-2 brite" 
                          onClick={() => {bidOn()}}
                          id="place-bid-btn">PLACE BID</button>
                      </div>
                      {offerer.toLowerCase() === connectedAddress.toLowerCase() ?
                        <button 
                          className="v3-bg black-txt w-full p-1 my-2 brite"
                          onClick={() => {cancelBid()}}
                          id="cxl-bid-btn">
                          CANCEL BID
                        </button>
                        :
                        null
                      }
                    </div>
                    :
                    <div className="seller-buttons">
                      {!listed.isForSale ?
                        <>
                          <button 
                            className="v3-bg black-txt w-full p-1 my-2 brite" 
                            onClick={listToggle}
                            id="list-btn-togl">LIST</button>
                          <br id="delist-br"/>
                          <div id="enter-list-amount" className={listActive ? '' : 'hidden'}>
                            <input 
                              className="lite-v3-bg w-full p-1 my-2 black-txt" 
                              type="number" 
                              name="sell-amt" 
                              placeholder="list price"
                              min="0"
                              id="sell-amt"
                              onChange={(e) => setListPrice(e.target.value)}
                            />
                            <br/>
                            <button 
                              className="black-bg v3-txt v3-b w-full p-1 my-2 brite" 
                              onClick={() => {list()}}
                              >LIST</button>
                          </div>
                        </>
                        :
                        <>
                          <button 
                            className="v3-bg black-txt w-full p-1 my-2 brite" 
                            onClick={() => {delist()}}
                            id="delist-btn">DELIST</button>
                          <br/>
                        </>
                      }
                      {offers.length === 0 ?
                        null
                        :
                        <button 
                          className="v3-bg black-txt w-full p-1 my-2 brite" 
                          onClick={() => {acceptBid()}}
                          id="accept-bid-btn">
                          ACCEPT BID
                        </button>
                      }
                    </div>
                  }
                </div>
                :
                <div 
                  className="p-3 black-bg v3-txt v3-b w-full"  
                  id="not-connected">
                    Please connect your wallet to interact with this Phunk
                </div>
              }
            </div>
          </div>
          <div className="row-wrapper mt-5">
            <History 
              transactions={transactionHistory}
            />
          </div>
        </div>
      </div>
      <Footer/>      
    </>
  )
}