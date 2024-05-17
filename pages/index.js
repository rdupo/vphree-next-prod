import { React, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SaleCard from '../components/SaleCard'
import FlywheelCard from '../components/flywheelCard'
import Router from 'next/router'
import { Silkscreen, Montserrat } from 'next/font/google'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import getV3Sales from '../hooks/v3Sales'
import getNllSales from '../hooks/nllSales'
import { Network, Alchemy } from 'alchemy-sdk'
import phunkAddy from '../utils/phunkAddy'
import { useSearchParams } from "next/navigation";


export default function Home() {
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [iWidth, setIWidth] = useState(getInitialWidth());
  const { sales } = getV3Sales();
  const { nllSales } = getNllSales();
  const [searchAddy, setSearchAddy] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const searchParams = useSearchParams();
  let c = searchParams.get("c") || "vphree"
  console.log(c)
  const [mp, setMp] = useState(c);
  console.log(mp)
  let salesBand, vphreeText, nllText;
  //console.log("nll", nllSales);
  //console.log("sales", sales)

  useEffect(() => {
    setMp(c)
  },[c]);

  if(mp === "vphree") {
    salesBand = "v3-bg"
    vphreeText = "cursor-pointer text-black"
    nllText = "cursor-pointer text-green-600"
  } else {
    salesBand = "v2-bg"
    vphreeText = "cursor-pointer text-green-600"
    nllText = "cursor-pointer text-black"
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
        <div className="g-bg black-txt">
          <div className="pl-8 text-green-500">
            <p>
              <span className="black-txt">Recent Sales: &nbsp;</span>
              <span 
                className={vphreeText}
                onClick={() => {setMp("vphree")}}
              >
              vPhree</span> |&nbsp;
              <span 
                className={nllText}
                onClick={() => {setMp("nll")}}
              >NLL</span></p>
          </div>
          <div className={`${salesBand} flex flex-wrap justify-center border-b-4 g-b-c`}>
            {mp === "vphree" ?
              (sales.slice(0, iWidth).map((sale) => (
              sales.length > 0 ? (
                <SaleCard
                  key={sale.id + sale.price + Math.random()}
                  price={sale.price + "Ξ"}
                  atts=""
                  id={sale.id}
                  coll="v3"
                />
              ) : null)))
              :
              (nllSales.slice(0, iWidth).map((sale) => (
              nllSales.length > 0 ? (
                <SaleCard
                  key={sale.id + sale.price + Math.random()}
                  price={sale.price + "Ξ"}
                  atts=""
                  id={sale.id}
                  coll="v2"
                />
              ) : null)))}
          </div>
        </div>
        <div className="home-wrapper">
          <h2 className="home-title g-txt leading-none mb-4">Welcome to vPhree</h2>
          <p className="text-xl w-75">vPhree is the front door to all things Phunky. View your Phunks across all 3 collections, check out the latest Treasury Proposal, place a bid on the current auction, get Flywheel estimates, and more--all in one place.</p>
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
            <Link href="/hub/philip-intern-project">
              <button className="w-60 mobile-100 cta g-b g-bg black-txt">Phunky Hub</button>
            </Link>
            <Link href="/collections/v3-phunks">
              <button className="w-60 mobile-100 cta g-b g-txt black-bg">v3 Marketplace</button>
            </Link>
            <Link href="/dose-of-phunks">
              <button className="w-60 mobile-100 cta bg-[#ffb900] black-txt b-b">Dose of Phunks</button>
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
