import { React, useState, useEffect } from 'react'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Footer from '../../components/Footer'
import History from '../../components/History_qBC'
import getTxnHistory from '../../hooks/philipMarketHistory'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from 'ethers'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkAtts'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import philips from '../../utils/philips'
import wv1pAddy from '../../utils/wv1pAddy'
import wv1pAbi from '../../utils/wv1pAbi'
/* --- delete --- */
import philipAddy from '../../utils/philipAddy'
import philipAbi from '../../utils/philipAbi'
/* --- delete --- */

export default function Philips() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const router = useRouter()
  const id = router.query.id
  const atts = phunks[id]
  const collectionContract = philipAddy
  const marketContract = philipMarketAddy
  const v3Abi = philipAbi
  const marketAbi = philipMarketAbi
  const [listed, setListed] = useState([]);
  const [offers, setOffers] = useState('');
  const [offerer, setOfferer] = useState('');
  const [offererEns, setOffererEns] = useState('');
  const { connectedAddress, setConnectedAddress } = useWallet();
  const [owner, setOwner] = useState('');
  const [ownerEns, setOwnerEns] = useState('');
  const [bidActive, setBidState] = useState(false);
  const [listActive, setListState] = useState(false);
  const { transactionHistory } = getTxnHistory(id);
  const [listPrice, setListPrice] = useState('');
  const [bid, setBid] = useState('');
  const provider = new ethers.providers.AlchemyProvider('homestead', alcKey);
  const [signer, setSigner] = useState([]);
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>
  const [isHovered, setIsHovered] = useState(false);
  let alt_id,imageSrc,imageWrapperClassName;

  const hasPhilip = (x) => {
    return philips.some(entry => entry.tokenId === Number(x));
  }

  const resolveENS = async (address) => {
    try {
      const ensName = await provider.lookupAddress(address);
      return ensName;
    } catch (error) {
      console.error('Error resolving ENS name:', error.message);
      return null;
    }
  };

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
          const oEns = await resolveENS(o)
          setOwner(o);
          setOwnerEns(oEns);
        } catch (error) {  }

        try {
          const listing = await market.phunksOfferedForSale(id);
          setListed(listing);
          //console.log('seller: ', listing.seller);
        } catch (error) {  }

        try {
          const bids = await market.phunkBids(id);
          const topBid = bids.value;
          if (topBid > 0) {
            setOffers(topBid);
            setOfferer(bids.bidder);
            const bidderEns = await resolveENS(bids.bidder);
            setOffererEns(bidderEns);
            //console.log("bid from: ", offerer, "; connected: ", connectedAddress);
            //console.log('offerer ENS', offererEns);
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
    const storedAddress = sessionStorage.getItem('connectedAddress');
    if (storedAddress && connectedAddress !== storedAddress) {
      setConnectedAddress(storedAddress);
    }
  }, [id,connectedAddress, setConnectedAddress]);

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

  async function listPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const cc = new ethers.Contract(collectionContract, v3Abi, signer);
    const ap = await cc.isApprovedForAll(connectedAddress, marketContract);
    if (ap) {
      const lPrice = ethers.utils.parseUnits(listPrice, 'ether');
      const listPromise = cpmp.offerPhunkForSale(id, lPrice);
      txnToast(listPromise, `Listing Philip for ${ethers.utils.formatEther(lPrice)}Ξ`);      
      await listPromise
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
            setListState(false);
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
    } else {
      const setApproval = cc.setApprovalForAll(marketContract, true);
      txnToast(setApproval, `Allowing vPhree to access Philips`);

      await setApproval.then(async (result) => {
        const rh = result.hash;
        await mmp.waitForTransaction(rh).then(async (approvalReceipt) => {
          if (approvalReceipt.status === 1) { // Check if approval transaction was successful
            toast.dismiss();
            toast('Approval set!', {
              style: {
                minWidth: '80%',
                color: '#000',
                background: '#ffb900',
              },
            });

            const lPrice = ethers.utils.parseUnits(listPrice, 'ether');
            const listPromise = cpmp.offerPhunkForSale(id, lPrice);
            txnToast(listPromise, `Listing Philip for ${ethers.utils.formatEther(lPrice)}Ξ`);

            await listPromise.then(async (result) => {
              const rh = result.hash;
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
                  setListState(false);
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
  }

  async function delistPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const delistPromise = cpmp.phunkNoLongerForSale(id);
    txnToast(delistPromise, `Delisting Philip`); 
    await delistPromise
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
      txnToast(acceptBidPromise, `Accepting bid of ${ethers.utils.formatUnits(bidPrice,18)}Ξ`);
      await acceptBidPromise
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
    } else {
      const setApproval = cc.setApprovalForAll(marketContract, true);
      txnToast(setApproval, `Allowing vphree to access v3phunks`);

      await setApproval.then(async (result) => {
        const rh = result.hash;
        await mmp.waitForTransaction(rh).then(async (receipt) => {
          if (receipt.status === 1) { // Check if transaction was successful
            toast.dismiss();
            toast('Approval set!', {
              style: {
                minWidth: '80%',
                color: '#000',
                background: '#ffb900',
              },
            });

            const acceptBidPromise = cpmp.acceptBidForPhunk(id, bidPrice);
            txnToast(acceptBidPromise, `Accepting bid of ${ethers.utils.formatUnits(bidPrice, 18)}Ξ`);
            
            await acceptBidPromise.then(async (result) => {
              const rh = result.hash;
              await mmp.waitForTransaction(rh).then((acceptReceipt) => {
                if (acceptReceipt.status === 1) { // Check if transaction was successful
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
  }

  async function buyPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const buyPhunkPromise = cpmp.connect(signer).buyPhunk(id, {value: listed.minValue._hex});
    txnToast(buyPhunkPromise, `Buying Philip for ${ethers.utils.formatUnits(listed.minValue._hex,18)}Ξ`);
    await buyPhunkPromise
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

  async function bidOnPhunk() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    console.log(cpmp);
    const ethBid = ethers.utils.parseUnits(bid, 'ether');
    const enterBidPromise = cpmp.enterBidForPhunk(id, {value: ethBid});
    txnToast(enterBidPromise, `Entering bid of ${ethers.utils.formatEther(ethBid)}Ξ`);
    await enterBidPromise
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
            setBidState(false);
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

  async function cancelPhunkBid() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const withdrawBidPromise = cpmp.withdrawBidForPhunk(id);
    txnToast(withdrawBidPromise, `Canceling bid for Philip`);  
    await withdrawBidPromise
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
            Router.reload();
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
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <div className="row-wrapper block px-0 py-4">
            <div className="nft-info inline-block pl-0 align-top v1-bg w-full">              
              <div 
                className='nft-info inline-block pl-0 align-top v1-bg w-full'
              >
                <div id="img-wrapper">
                  <Image
                    src={`/phunks/phunk${alt_id}.svg`}
                    alt={`image of Philip ${id}`}
                    width={500}
                    height={500}
                  />
                </div>
              </div>
            </div>
            <h2 id="title" className="g-txt mb-3">Philip #{id}</h2>
            <p className="drk-grey-txt mb-4 collection-desc">Want to unwrap your Philip? Check out the <Link href="/hub/philip-intern-project">Phunky Hub</Link></p>
            <div className="metadata inline-block align-top w-full md:w-3/12">
              <div className="id-and-owner">
                <p>Owner</p>
                <div 
                  id="owner" 
                  className="collection-desc brite g-txt sans-underline"
                  onClick={() => {connectedAddress.toLowerCase() === owner.toLowerCase() ?
                                  Router.push({pathname: `/account/${owner}`}) :
                                  Router.push({pathname: `/profile/${owner}`})}}>
                  {
                    ownerEns ?
                    ownerEns :
                    owner.substr(0,4) + `...` + owner.substr(owner.length-4, owner.length)
                  }
                </div>
              </div>
            </div>
            <div className="atts-div metadata inline-block align-top w-full md:w-3/12">
              <p>Get the 🟪🟦🟩</p>
              <p>
                <a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce/${id}`}
                >
                  Philip #{id}
                </a>
              </p>
              <p>
                <a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xf07468ead8cf26c752c676e43c814fee9c8cf402/${id}`}
                >
                  CryptoPhunk #{id}
                </a>
              </p>
              <p>
                <a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xb7d405bee01c70a9577316c1b9c2505f146e8842/${id}`}
                >
                  v3Phunk #{id}
                </a>
              </p>
            </div>
            <div className="atts-div metadata inline-block align-top w-full md:w-3/12">
              <p>Attributes</p>
              <div className="metadata" id="md">
                <div className="collection-desc g-txt my-1" dangerouslySetInnerHTML={{ __html: atts}} />
              </div>
            </div>
            <div className="contract-interactions inline-block pr-0 align-top w-full md:w-3/12">
              <div className="price-and-bid">
                {!listed.isForSale || owner !== listed.seller ?
                  null
                  :
                  <p id="price">Price:&nbsp;
                    <span className="collection-desc g-txt">
                      {ethers.utils.formatUnits(listed.minValue._hex,18) + 'Ξ'}
                    </span>
                  </p>
                }
                {offers.length === 0 ?
                  null
                  :
                  <>
                    <p id="bid" className="">Top Bid:&nbsp;
                      <span className="collection-desc g-txt">{ethers.utils.formatUnits(offers._hex,18) + 'Ξ'}</span>
                    </p>
                    <p className="">Bidder:&nbsp; 
                      <span 
                        id="top-bidder"
                        className="collection-desc brite g-txt sans-underline"
                        onClick={() => {connectedAddress === offerer ?
                                        Router.push({pathname: `/account/${offerer}`}) :
                                        Router.push({pathname: `/profile/${offerer}`})}}
                      >
                        {
                          offererEns ?
                          offererEns :
                          offerer.substr(0,4) + `...` + offerer.substr(offerer.length-4, offerer.length)
                        }
                      </span>
                    </p>
                  </>
                }
              </div>
              {connectedAddress.length > 0 ?
                <div> 
                  {connectedAddress.toLowerCase() !== owner.toLowerCase() ?
                    <div className="" id="buy-bid-buttons">
                      {!listed.isForSale || owner !== listed.seller ?
                        null
                        :
                        <><button 
                          className="g-bg black-txt w-full p-1 my-2 brite" 
                          onClick={() => {buy()}}
                          id="buy-btn">BUY</button><br/></>
                      }
                      <button 
                        className="g-bg black-txt w-full p-1 my-2 brite" 
                        onClick={bidToggle}
                        id="bid-btn-togl">BID
                      </button>
                      <br/>
                      <div className={bidActive ? '' : 'hidden'} id="enter-bid-amount">
                        <input
                          className="bg-green-100 w-full p-1 my-2 black-txt" 
                          type="number" 
                          name="bid-amt" 
                          placeholder="bid amount"
                          min="0"
                          id="bid-amt"
                          onChange={(e) => setBid(e.target.value )}
                        />
                        <br/>
                        <button 
                          className="black-bg g-txt g-b w-full p-1 my-2 brite" 
                          onClick={() => {bidOn()}}
                          id="place-bid-btn">PLACE BID</button>
                      </div>
                      {offerer.toLowerCase() === connectedAddress.toLowerCase() ?
                        <button 
                          className="g-bg black-txt w-full p-1 my-2 brite"
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
                            className="g-bg black-txt w-full p-1 my-2 brite" 
                            onClick={listToggle}
                            id="list-btn-togl">LIST</button>
                          <br id="delist-br"/>
                          <div id="enter-list-amount" className={listActive ? '' : 'hidden'}>
                            <input 
                              className="bg-green-100 w-full p-1 my-2 black-txt" 
                              type="number" 
                              name="sell-amt" 
                              placeholder="list price"
                              min="0"
                              id="sell-amt"
                              onChange={(e) => setListPrice(e.target.value)}
                            />
                            <br/>
                            <button 
                              className="black-bg g-txt g-b w-full p-1 my-2 brite" 
                              onClick={() => {list()}}
                              >LIST</button>
                          </div>
                        </>
                        :
                        <>
                          <button 
                            className="g-bg black-txt w-full p-1 my-2 brite" 
                            onClick={() => {delist()}}
                            id="delist-btn">DELIST</button>
                          <br/>
                        </>
                      }
                      {offers.length === 0 ?
                        null
                        :
                        <button 
                          className="g-bg black-txt w-full p-1 my-2 brite" 
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
                  className="p-3 black-bg g-txt g-b w-full"  
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
      <div className="home-bg fixed top-0 left-0 right-0 -z-10"></div>
      <Footer
        bg='black'
      />    
    </>
  )
}