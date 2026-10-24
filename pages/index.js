import { React, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SaleCard from '../components/SaleCard'
import Router from 'next/router'
import { ethers } from 'ethers'
import useSales from '../hooks/useSales'

export default function Home() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const provider = new ethers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [iWidth, setIWidth] = useState(getInitialWidth());
  const { sales } = useSales('v3-phunks');
  const [searchAddy, setSearchAddy] = useState("");
  const [showWarning, setShowWarning] = useState(false);

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
  }, []); // Empty dependency array ensures that the effect runs only on mount and unmount

  function getInitialWidth() {
    if(typeof(window) !== 'undefined') {
      return parseInt(((window.innerWidth) - 16) / 70) >= 20
        ? 20
        : parseInt(((window.innerWidth) - 16) / 70);
    }
  }

  // Callback function to update connectedWallet in the page
  const updateConnectedWallet = (newWallet) => {
    setConnectedAddress(newWallet);
  };

  // Push to correct dashboard page
  async function search() {
    if (searchAddy.length === 42) {
      setShowWarning(false)
      Router.push({ pathname: `/dashboard/${searchAddy}` })
    } else if (searchAddy.toLowerCase().search('eth') > -1) {
      setShowWarning(false)
      const resolvedAddy = await provider.resolveName(searchAddy)
      console.log("resolved:", resolvedAddy)
      if(resolvedAddy) { Router.push({ pathname: `/dashboard/${resolvedAddy}` })}
      else {setShowWarning(true)}
    } else {
      setShowWarning(true)
    }
  }

  return (
    <>
      <Header onUpdateConnectedWallet={updateConnectedWallet} />
      <div className="content bg-opacity-60 bg-black txt-new-fallback">
        {sales.length > 0 ?
          <div className="g-bg black-txt">
            <div className="pl-8 text-green-500">
              <p>
                <span className="black-txt">Recent V3 Sales: &nbsp;</span>
              </p>
            </div>
            <div className={`v3-bg flex flex-wrap justify-center border-b-4 g-b-c`}>
              {sales.slice(0, iWidth).map((sale) => (
                <SaleCard
                  key={sale.hash + sale.id}
                  price={sale.price + "Ξ"}
                  atts=""
                  id={sale.id}
                  coll="v3"
                />
              ))}
            </div>
          </div>
          : null
        }
        <div className="home-wrapper">
          <h2 className="home-title g-txt leading-none mb-4">Welcome to vPhree</h2>
          <p className="text-xl w-75">vPhree is the front door to all things Phunky. View your Phunks across all 3 collections, check out the latest Treasury Proposal, place a bid on the current auction, and more--all in one place.</p>
          <div id="search-wallet" className="inline-flex w-full my-4">
            <input
              className="bg-green-100 w-5/6 p-1 my-2 black-txt" 
              type="text" 
              name="address" 
              placeholder="WALLET ADDRESS OR ENS"
              id="address-value"
              onChange={(e) => setSearchAddy(e.target.value)}
            />
            <button 
              className="black-bg g-txt g-b w-1/6 p-1 my-2 brite" 
              onClick={() => {search()}}
              id="search-btn">GO</button>
          </div>
          <p className={!showWarning ? "hidden" : "text-red-500 text-base"}>
              Please enter a valid wallet address or ENS domain
          </p>
          <div>          
            <Link href="/collections/v3-phunks">
              <button className="w-60 mobile-100 cta v3-b v3-txt black-bg">v3 Phunks Marketplace</button>
            </Link>
            <Link href="/collections/philip-intern-project">
              <button className="w-60 mobile-100 cta v2-b philip-txt black-bg">Philip Marketplace</button>
            </Link>
            <Link href="/collections/wrapped-v1-phunks">
              <button className="w-60 mobile-100 cta v1-b v1-txt black-bg">Wrapped v1 Marketplace</button>
            </Link>
            <Link href="/hub/philip-intern-project">
              <button className="w-60 mobile-100 cta bg-[#ffb900] black-txt y-b">Phunky Hub</button>
            </Link>
            <Link href="/dose-of-phunks">
              <button className="w-60 mobile-100 cta bg-[#ffb900] black-txt y-b">Dose of Phunks</button>
            </Link>
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
