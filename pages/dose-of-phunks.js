import { React, useEffect, useState } from 'react'
import Image from 'next/image';
import Link from 'next/link'
import Header from '../components/Header'
import Footer from '../components/Footer'
import SaleCard from '../components/SaleCard'
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
      <Header onUpdateConnectedWallet={updateConnectedWallet} />
      <div className="content bg-opacity-60 bg-black">
        <div className="home-wrapper">
          <h2 className="home-title g-txt">DOPE | S3 E2</h2>
          <p className="text-xl mb-8 g-txt">Three Year Phunky Anniversary Philip Edition</p>
          <p>by&nbsp; 
            <a 
              target="_blank"
              href="https://twitter.com/NfTenchi"
            >
            @NFTenchi
            </a>
          </p>
          <p className="home-body w-75 my-4">Phunks never shy away from being innovative creative, disruptors, and trendsetters. Here’s a monthly DOSE of that ethos.</p>
          <div>
            {/*<p>Image goes here...</p>
            <Link href="/collections/v3-phunks">
              <button className="mobile-100 cta v3-bg v3-b black-txt">Claim</button>
            </Link>*/}
            <div dangerouslySetInnerHTML={{ 
              __html:
              `<div
              data-widget="m-claim-complete"
              data-id="3837104368"
              ></div>`
            }}/>
          </div>
          <div className="hidden">
            <div  
              data-widget="m-connect"  
              data-app-name="doseofphunks"  
              data-network="1"
              data-id="535914736"
            >
            </div>
          </div>
          <p className="home-body w-75 mt-28">Dose of Phunks Editions | Season 3</p>
          <div className="inline-block">
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunksS3-edition1">
            <div className="mr-4">
              <p>S3 E1</p>
              <Image 
                className="w-100"
                src="/dope_s3e1.png"
                loading="lazy"
                alt="dose of phunks s3 e1"
                height="100"
                width="100"
              /> 
            </div></a>
          </div>
          <p className="home-body w-75 mt-12">Dose of Phunks Editions | Season 2</p>
          <div className="inline-block">
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition1">
            <div className="mr-4">
              <p>S2 E1</p>
              <Image 
                className="w-100"
                src="/dope_s2e1.png"
                loading="lazy"
                alt="dose of phunks s2 e1"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition2">
            <div className="mr-4">
              <p>S2 E2</p>
              <Image 
                className="w-100"
                src="/dope_s2e2.png"
                loading="lazy"
                alt="dose of phunks s2 e2"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition3">
            <div className="mr-4">
              <p>S2 E3</p>
              <Image 
                className="w-100"
                src="/dope_s2e3.png"
                loading="lazy"
                alt="dose of phunks s2 e3"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition4">
            <div className="mr-4">
              <p>S2 E4</p>
              <Image 
                className="w-100"
                src="/dope_s2e4.png"
                loading="lazy"
                alt="dose of phunks s2 e4"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition5">
            <div className="mr-4">
              <p>S2 E5</p>
              <Image 
                className="w-100"
                src="/dope_s2e5.png"
                loading="lazy"
                alt="dose of phunks s2 e5"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunksedition-6">
            <div className="mr-4">
              <p>S2 E6</p>
              <Image 
                className="w-100"
                src="/dope_s2e6.png"
                loading="lazy"
                alt="dose of phunks s2 e6"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunksedition-7">
            <div className="mr-4">
              <p>S2 E7</p>
              <Image 
                className="w-100"
                src="/dope_s2e7.png"
                loading="lazy"
                alt="dose of phunks s2 e7"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition8">
            <div className="mr-4">
              <p>S2 E8</p>
              <Image 
                className="w-100"
                src="/dope_s2e8.png"
                loading="lazy"
                alt="dose of phunks s2 e8"
                height="100"
                width="100"
              /> 
            </div></a>
            <a className="inline-block mb-4" target="_blank" href="https://app.manifold.xyz/c/doseofphunks-edition9">
            <div className="mr-4">
              <p>S2 E9</p>
              <Image 
                className="w-100"
                src="/dope_s2e9.png"
                loading="lazy"
                alt="dose of phunks s2 e9"
                height="100"
                width="100"
              /> 
            </div></a>
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
