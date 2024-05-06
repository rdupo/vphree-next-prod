import { React, useState, useEffect } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Footer from '../../components/Footer'
import History from '../../components/History_qBC'
import getTxnHistory from '../../hooks/nllTxnHistory'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from 'ethers'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkAtts'
import philips from '../../utils/philips'

import nllAddy from '../../utils/nllAddy'
import nllAbi from '../../utils/nllAbi'
import phunkAddy from '../../utils/phunkAddy'
import phunkAbi from '../../utils/phunkAbi'

export default function V3Phunks() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const router = useRouter()
  const id = router.query.id
  const atts = phunks[id]
  const collectionContract = phunkAddy
  const marketContract = nllAddy
  const v3Abi = phunkAbi
  const marketAbi = nllAbi
  const [listed, setListed] = useState([]);
  const [offers, setOffers] = useState('');
  const [offerer, setOfferer] = useState('');
  const [offererEns, setOffererEns] = useState('');
  const { connectedAddress, setConnectedAddress } = useWallet();
  //console.log("connected: ", connectedAddress)
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
  let alt_id

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
          //------- UPDATE - NEED TO SEE IF TRANSFER AFTER LIST BLOCK ---------------------
          const listing = await market.phunksOfferedForSale(id);
          setListed(listing);
          //console.log('listing: ', listing);
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
  
  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <div className="row-wrapper block px-0 py-4">
            <div className="nft-info inline-block pl-0 align-top v2-bg w-full">
              <div id="img-wrapper">
                <Image
                  src={`/phunks/phunk${alt_id}.svg`}
                  alt={`image of phunk ${id}`}
                  width={500}
                  height={500}
                />
              </div>
            </div>
            <h2 id="title" className="g-txt mb-3">CryptoPhunk #{id}</h2>
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
            {!hasPhilip(id) ?
              <div className="atts-div metadata inline-block align-top w-full md:w-3/12">
                <p>Get the 🍐</p>
                <p><a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xf07468ead8cf26c752c676e43c814fee9c8cf402/${id}`}
                >
                  CryptoPhunk {id}
                </a></p>
                <p><a
                  className="collection-desc" 
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xb7d405bee01c70a9577316c1b9c2505f146e8842/${id}`}
                >
                  v3Phunk {id}
                </a></p>
              </div>
              :
              <div className="atts-div metadata inline-block align-top w-full md:w-3/12">
                <p>Get the 🟪🟦🟩</p>
                <p><a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce/${id}`}
                >
                  Philip #{id}
                </a></p>
                <p><a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xf07468ead8cf26c752c676e43c814fee9c8cf402/${id}`}
                >
                  CryptoPhunk #{id}
                </a></p>
                <p><a 
                  className="collection-desc"
                  target="_blank" 
                  href={`https://pro.opensea.io/nft/ethereum/0xb7d405bee01c70a9577316c1b9c2505f146e8842/${id}`}
                >
                  v3Phunk #{id}
                </a></p>
              </div>
            }
            <div className="atts-div metadata inline-block align-top w-full md:w-3/12">
              <p>Attributes</p>
              <div className="metadata" id="md">
                <div className="collection-desc g-txt my-1" dangerouslySetInnerHTML={{ __html: atts}} />
              </div>
            </div>
            <div className="contract-interactions inline-block pr-0 align-top w-full md:w-3/12">
              <div className="price-and-bid">
                {!listed.isForSale || listed.seller != owner ?
                  <p>Phunk not listed</p>
                  :
                  <p id="price">Price:&nbsp;
                    <span className="collection-desc g-txt">
                      {ethers.utils.formatUnits(listed.minValue._hex,18) + 'Ξ'}
                    </span>
                  </p>
                }
                {offers.length === 0 ?
                  <p>Phunk has no bids</p>
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
                <a target="_blank" href={`https://notlarvalabs.com/cryptophunks/details/${id}`}>View on NLL</a>
              </div>
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