import { React, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SaleCard from '../components/SaleCard'
import { Silkscreen, Montserrat } from 'next/font/google'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import getV3Sales from '../hooks/v3Sales'

export default function Home() {
  const [connectedAddress, setConnectedAddress] = useState(null);
  const [iWidth, setIWidth] = useState(getInitialWidth());
  const { sales } = getV3Sales();

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

  return (
    <>
      <Header onUpdateConnectedWallet={updateConnectedWallet} />
      <div className="content home-bg">
        <div className="bg-[#ffba00] black-txt">
          <div className="pl-8">
            <p>Recent Sales</p>
          </div>
          <div className="v3-bg flex flex-wrap justify-center border-b-4 border-[#ffba00]">
            {sales.slice(0, iWidth).map((sale) => (
              sales.length > 0 ? (
                <SaleCard
                  key={sale.id}
                  price={sale.price + "Ξ"}
                  atts=""
                  id={sale.id}
                  coll="phunk"
                />
              ) : null
            ))}
          </div>
        </div>
        <div className="home-wrapper">
          <h2 className="home-title v3-txt">Welcome to vPhree</h2>
          <p className="home-body w-75">vPhree is a phee-phree marketplace to buy and sell v3 Phunks</p>
          <div>
            <Link href="/collections/v3-phunks">
              <button className="cta v3-bg v3-b black-txt">v3 Marketplace</button>
            </Link>
            <Link href="/view-all/v3-phunks">
              <button className="cta v3-b black-bg v3-txt">View All v3s</button>
            </Link>
          </div>
        </div>
      </div>
      <Footer
        bg='black'
      />
    </>
  )
}
