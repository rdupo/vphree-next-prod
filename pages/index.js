import { React, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from  '../components/Header'
import Footer from '../components/Footer'
import { Silkscreen, Montserrat } from 'next/font/google'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'

export default function Home() {  
  const [connectedAddress, setConnectedAddress] = useState(null);

  // Callback function to update connectedWallet in the page
  const updateConnectedWallet = (newWallet) => {
    setConnectedAddress(newWallet);
  };

  return (
    <>
      <Header onUpdateConnectedWallet={updateConnectedWallet}/>
      <div className="content home-bg">
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