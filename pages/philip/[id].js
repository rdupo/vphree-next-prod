import { React, useState, useEffect } from 'react'
import Link from 'next/link'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Footer from '../../components/Footer'
import History from '../../components/History_qBC'
import philipTxnHistory from '../../hooks/philipTxnHistory'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from 'ethers'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkAtts'
import philipAddy from '../../utils/philipAddy'
import philipAbi from '../../utils/philipAbi'

export default function V3Phunks() {
  const router = useRouter()
  const id = router.query.id
  const atts = phunks[id]
  const alcKey = process.env.NEXT_PUBLIC_API_KEY

  //start updates
  const collectionContract = philipAddy
  const collAbi = philipAbi
  //end updates

  const { connectedAddress, setConnectedAddress } = useWallet();
  const [owner, setOwner] = useState('');
  const [ownerEns, setOwnerEns] = useState('');
  const { transactionHistory } = philipTxnHistory(id);
  const provider = new ethers.providers.AlchemyProvider('homestead', alcKey);
  const [signer, setSigner] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  let imageSrc;
  let imageWrapperClassName;
  let alt_id;

  const resolveENS = async (address) => {
    try {
      const ensName = await provider.lookupAddress(address);
      return ensName;
    } catch (error) {
      console.error('Error resolving ENS name:', error.message);
      return null;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
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

  // Set values based on hover state
  if (isHovered) {
    imageSrc = `/phunks/phunk${alt_id}.svg`;
    imageWrapperClassName = 'nft-info inline-block pl-0 align-top v1-bg w-full';
  } else {
    imageSrc = '/phunks/philip.png';
    imageWrapperClassName = 'nft-info inline-block pl-0 align-top philip-bg w-full';
  }

  //get owner
  const fetchDataWithRetry = async () => {
    const maxRetries = 5;
    let retries = 0;
    let success = false;

    while (retries < maxRetries && !success) {
      try {
          const cc = new ethers.Contract(collectionContract, collAbi, provider);
        try {
          const o = await cc.ownerOf(id).then(new Response);
          const oEns = await resolveENS(o)
          setOwner(o);
          setOwnerEns(oEns);
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
  
  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <div className="row-wrapper block px-0 py-4">
            <div 
              className={imageWrapperClassName}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div id="img-wrapper">
                <Image
                  src={imageSrc}
                  alt={`image of Philip ${id}`}
                  width={500}
                  height={500}
                />
              </div>
            </div>
            <h2 id="title" className="v3-txt">Philip #{id}</h2>
            <p className="drk-grey-txt mb-4 collection-desc">Hover displays a preview of the wrapped Philip. Wrap your Philips at <Link href="https://www.v1phunks.io/" target="_blank">v1phunks.io</Link></p>
            <div className="metadata inline-block align-top w-full md:w-3/12">
              <div className="id-and-owner">
                <p>Owner</p>
                <div 
                  id="owner" 
                  className="collection-desc brite v3-txt sans-underline"
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
            <div className="atts-div metadata inline-block align-top w-full md:w-5/12">
              <p>Attributes</p>
              <div className="metadata" id="md">
                <div className="collection-desc v3-txt my-1" dangerouslySetInnerHTML={{ __html: atts}} />
              </div>
            </div>
            <div className="contract-interactions inline-block pr-0 align-top w-full md:w-4/12">
              <p>Triphecta Links</p>
              <p className="collection-desc"><Link href={`https://opensea.io/assets/ethereum/0xa82f3a61f002f83eba7d184c50bb2a8b359ca1ce/${id}`} target="_blank">View Philip</Link></p>
              <p className="collection-desc"><Link href={`https://notlarvalabs.com/cryptophunks/details/${id}`} target="_blank">View Cryptophunk v2</Link></p>
              <p className="collection-desc"><Link href={`https://www.vphree.io/phunk/${id}`} target="_blank">View v3Phunk</Link></p>
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