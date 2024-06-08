import { React, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from  '../../components/Header'
import CollectionInfo from '../../components/CollectionInfo'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import Twitter from '../../assets/twitter.png'
import Etherscan from '../../assets/etherscan.png'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from 'ethers'
import { useWallet } from '../../contexts/WalletContext'
import phunkAttMap from '../../utils/phunkAttMap'
import wrapperAddy from '../../utils/wrapperAddy'
import wrapperAbi from '../../utils/wrapperAbi'
import wv1pAddy from '../../utils/wv1pAddy'
import wv1pAbi from '../../utils/wv1pAbi'
import Banner from '../../assets/wv1p-banner.png'

export default function PhilipMarket() {
  const collectionContract = wrapperAddy
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const maps = "https://www.cryptophunks.com/"
  const target = "_blank"
  const desc = ["V1 Phunks are not a derivative, but are in fact the original set of Phunks released in 2021 (and actually predate the release of CryptoPhunks NFTs). This is verified on the Ethereum blockchain and is immutable. Wrapped v1 Phunks restore the image and metadata lost when the origional 1,004 CryptoPhunks were converted to Philips. You can unwrap your Wrapped v1 Phunk using the ", <Link key="phlink" href="/hub/philip-intern-project">Phunky Hub</Link>,"."]
  const [listed, setListed] = useState([]);
  const [f, setF] = useState({})
  const [filtersActive, setFilterState] = useState(false)
  const [sortActive, setSortState] = useState(false)
  const [fP, setFP] = useState([])
  const [displayedData, setDisplayedData] = useState([]);
  const { connectedAddress } = useWallet();
  const [mostRecentPhunkOfferedEvent, setMostRecentPhunkOfferedEvent] = useState({ blockNumber: 19965241 });

  // trait and id filtering
  //sort listings
  const sortData = (order) => {
    const sortOrder = order === "asc" ? 1 : -1; // 1 for ascending, -1 for descending

    if (fP.length === 0) {
      const sortedListed = [...listed].sort((a, b) => {
        const aa = ethers.utils.formatUnits(a.args.minValue._hex,18);
        const bb = ethers.utils.formatUnits(b.args.minValue._hex,18);
        return sortOrder * (aa - bb);
      });
      setListed(sortedListed);
      setDisplayedData(sortedListed); // Update the displayed data as well
    } else {
      const sortedFP = [...fP].sort((a, b) => {
        const aa = ethers.utils.formatUnits(a.args.minValue._hex,18);
        const bb = ethers.utils.formatUnits(b.args.minValue._hex,18);
        return sortOrder * (aa - bb);
      });
      setFP(sortedFP);
      setDisplayedData(sortedFP); // Update the displayed data as well
    }
  };

  //toggle class
  const filterToggle = () => {
    setFilterState((current) => !current)
  }

  const sortToggle = () => {
    setSortState((current) => !current)
  }

  //apply filtering based on f and sort the filteredData array here
  useEffect(() => {
    const filteredData = listed.filter((item) => {
      for (const [trait, value] of Object.entries(f)) {
        if (trait === 'tokenId') {
          if (ethers.utils.formatUnits(item.args.phunkIndex._hex,0).indexOf(value) === -1) {
            return false;
          }
        } else if  (trait === 'Traits') {
          if (item.attributes.length.toString() !== value) {
            return false;
          }
        } else {
          const matchingAttribute = item.attributes.find(attr => attr.trait_type === trait && attr.value === value);
          if (!matchingAttribute) {
            return false;
          }
        }
      }
      return true;
    });

    const sortedFilteredData = filteredData.slice().sort((a, b) => {
      const aa = ethers.utils.formatUnits(a.args.minValue._hex,18);
      const bb = ethers.utils.formatUnits(b.args.minValue._hex,18);
      return (aa - bb);
    });
    setDisplayedData(sortedFilteredData);
  }, [f]);

  //events approach
  useEffect(() => {
    const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
    const contract = new ethers.Contract(wv1pAddy, wv1pAbi, provider);
    const v3Contract = new ethers.Contract(wrapperAddy, wrapperAbi, provider)

    const initialActiveListings = [];
    const phunkIds = [];
    const currentListings = [];
    const phunkData = phunkAttMap;
    
    const fetchInitialActiveListings = async () => {
      const phunkOfferedFilter = contract.filters.PhunkOffered();
      const phunkBoughtFilter = contract.filters.PhunkBought();
      const phunkNoLongerForSaleFilter = contract.filters.PhunkNoLongerForSale();
      const phunkXferFilter = v3Contract.filters.Transfer();

      const initialPhunkOfferedEvents = await contract.queryFilter(phunkOfferedFilter);
      const initialPhunkBoughtEvents = await contract.queryFilter(phunkBoughtFilter);
      const initialphunkNoLongerForSaleEvents = await contract.queryFilter(phunkNoLongerForSaleFilter);
      const initialPhunkXferEvents = await v3Contract.queryFilter(phunkXferFilter, 19085195);

      const allEvents = [...initialPhunkOfferedEvents,
                         ...initialPhunkBoughtEvents, 
                         ...initialphunkNoLongerForSaleEvents,
                         ...initialPhunkXferEvents]

      // Sort the initialPhunkOfferedEvents by phunkIndex and blockNumber (newest to oldest)
      allEvents.sort((a, b) => {
        return b.blockNumber - a.blockNumber; // Sort by blockNumber if phunkIndexes are equal
      });

      // Iterate through sorted events and select the first occurrence of each unique phunkIndex
      allEvents.forEach(event => {
        const phunkIndex = typeof(event.args.phunkIndex) !== 'undefined' ? event.args.phunkIndex._hex : event.args.tokenId._hex;
        if (phunkIds.indexOf(phunkIndex) === -1) {
          phunkIds.push(phunkIndex);
          initialActiveListings.push(event);
        }

        const updatedListings = initialActiveListings.filter((event) => event.event == 'PhunkOffered')

        const attributesMap = {};
        phunkData.forEach(item => {
          attributesMap[item.tokenId] = item.attributes;
        });

        const updatedListingsFull = updatedListings.map(itemA => ({
          ...itemA,
          attributes: attributesMap[ethers.utils.formatUnits(itemA.args.phunkIndex._hex,0)], 
        }));
        setListed(updatedListingsFull);
        setDisplayedData(updatedListingsFull);
      });
    };
    fetchInitialActiveListings();
  },[]);

  return (
    <>
      <Header/>
      <div className="page bg-opacity-60 bg-black">
        <div className="banner-wrapper mb-6">
          <Image className="col-banner" src={Banner} width="100%" alt="v3 phunks banner"/>
        </div>
        <div className="content px-8 z-10">
          <CollectionInfo
            title="V3Phunks"
            desc={desc}
            twitter="https://twitter.com/v3phunks"
            contract={collectionContract}
          />
          <div className="filter-sort-wrapper mb-8">
            <div>
              <label className="mr-3">ID</label>
              <input 
                type="text" 
                id="id" 
                className="bg-green-100 black-txt" 
                name="id" 
                minLength="1" 
                maxLength="4" 
                placeholder="Phunk ID..." 
                onChange={(e) => setF((prevState) => ({ ...prevState, tokenId: e.target.value }))}
              />
              <button 
                id="view" 
                className={`g-bg black-txt brite ${filtersActive ? 'hidden' : ''}`} 
                onClick={filterToggle}>
                View Filters
              </button>
              <button 
                id="hide" 
                className={`g-bg black-txt brite ${filtersActive ? '' : 'hidden'}`} 
                onClick={filterToggle}>
                Hide Filters
              </button>
              <button 
                id="asc" 
                className={`g-bg black-txt brite ${sortActive ? 'hidden' : ''}`} 
                onClick={(e) => {sortData('asc'); sortToggle()}}>
                Low to High
              </button>
              <button 
                id="desc" 
                className={`g-bg black-txt brite ${sortActive ? '' : 'hidden'}`} 
                onClick={(e) => {sortData('desc'); sortToggle()}}>
                High to Low
              </button>
            </div>
            <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
                <div className="p-0 filter-dropdown" data-type="beard ">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Beard'] || ''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Beard: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Beard</option>                    
                    <option value="Big Beard">Big Beard</option>
                    <option value="Chinstrap">Chinstrap</option>
                    <option value="Front Beard">Front Beard</option>
                    <option value="Front Beard Dark">Front Beard Dark</option>
                    <option value="Goat">Goat</option>
                    <option value="Handlebars">Handlebars</option>
                    <option value="Luxurious Beard">Luxurious Beard</option>
                    <option value="Mustache">Mustache</option>
                    <option value="Muttonchops">Muttonchops</option>
                    <option value="Normal Beard">Normal Beard</option>
                    <option value="Normal Beard Black">Normal Beard Black</option>
                    <option value="Shadow Beard">Shadow Beard</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt"
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Beard'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="cheeks">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Cheeks']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Cheeks: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Cheeks</option>                    
                    <option value="Rosy Cheeks">Rosy Cheeks</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Cheeks'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="ears">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Ears']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Ears: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Ears</option>                    
                    <option value="Earring">Earring</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Ears'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="emotion">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Emotion']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Emotion: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Emotion</option>
                    
                    <option value="Frown">Frown</option>
                    <option value="Smile">Smile</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Emotion'];
                          return updatedState;
                        });
                      }}  
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="eyes">
                  <select 
                    className="select bg-green-100" 
                    type="text"
                    value={f['Eyes']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Eyes: e.target.value }));
                    }}>
                    <option value="" disabled hidden>Eyes</option>                    
                    <option value="3D Glasses">3D Glasses</option>
                    <option value="Big Shades">Big Shades</option>
                    <option value="Blue Eye Shadow">Blue Eye Shadow</option>
                    <option value="Classic Shades">Classic Shades</option>
                    <option value="Clown Eyes Blue">Clown Eyes Blue</option>
                    <option value="Clown Eyes Green">Clown Eyes Green</option>
                    <option value="Eye Mask">Eye Mask</option>
                    <option value="Eye Patch">Eye Patch</option>
                    <option value="Green Eye Shadow">Green Eye Shadow</option>
                    <option value="Horned Rim Glasses">Horned Rim Glasses</option>
                    <option value="Nerd Glasses">Nerd Glasses</option>
                    <option value="Purple Eye Shadow">Purple Eye Shadow</option>
                    <option value="Regular Shades">Regular Shades</option>
                    <option value="Small Shades">Small Shades</option>
                    <option value="VR">VR</option>
                    <option value="Welding Goggles">Welding Goggles</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Eyes'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="face">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Face']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Face: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Face</option>                    
                    <option value="Mole">Mole</option>
                    <option value="Spots">Spots</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Face'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="hair">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Hair']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Hair: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Hair</option>                    
                    <option value="Bandana">Bandana</option>
                    <option value="Beanie">Beanie</option>
                    <option value="Blonde Bob">Blonde Bob</option>
                    <option value="Blonde Short">Blonde Short</option>
                    <option value="Cap">Cap</option>
                    <option value="Cap Forward">Cap Forward</option>
                    <option value="Clown Hair Green">Clown Hair Green</option>
                    <option value="Cowboy Hat">Cowboy Hat</option>
                    <option value="Crazy Hair">Crazy Hair</option>
                    <option value="Dark Hair">Dark Hair</option>
                    <option value="Do-rag">Do-rag</option>
                    <option value="Fedora">Fedora</option>
                    <option value="Frumpy Hair">Frumpy Hair</option>
                    <option value="Half Shaved">Half Shaved</option>
                    <option value="Headband">Headband</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Knitted Cap">Knitted Cap</option>
                    <option value="Messy Hair">Messy Hair</option>
                    <option value="Mohawk">Mohawk</option>
                    <option value="Mohawk Dark">Mohawk Dark</option>
                    <option value="Mohawk Thin">Mohawk Thin</option>
                    <option value="Orange Side">Orange Side</option>
                    <option value="Peak Spike">Peak Spike</option>
                    <option value="Pigtails">Pigtails</option>
                    <option value="Pilot Helmet">Pilot Helmet</option>
                    <option value="Pink With Hat">Pink With Hat</option>
                    <option value="Police Cap">Police Cap</option>
                    <option value="Purple Hair">Purple Hair</option>
                    <option value="Red Mohawk">Red Mohawk</option>
                    <option value="Shaved Head">Shaved Head</option>
                    <option value="Straight Hair">Straight Hair</option>
                    <option value="Straight Hair Blonde">Straight Hair Blonde</option>
                    <option value="Straight Hair Dark">Straight Hair Dark</option>
                    <option value="Stringy Hair">Stringy Hair</option>
                    <option value="Tassle Hat">Tassle Hat</option>
                    <option value="Tiara">Tiara</option>
                    <option value="Top Hat">Top Hat</option>
                    <option value="Vampire Hair">Vampire Hair</option>
                    <option value="Wild Blonde">Wild Blonde</option>
                    <option value="Wild Hair">Wild Hair</option>
                    <option value="Wild White Hair">Wild White Hair</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Hair'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="lips">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Lips']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Lips: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Lips</option>                    
                    <option value="Black Lipstick">Black Lipstick</option>
                    <option value="Hot Lipstick">Hot Lipstick</option>
                    <option value="Purple Lipstick">Purple Lipstick</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Lips'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="mouth">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Mouth']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Mouth: e.target.value }));
                    }}
                    >
                    <option value="" disabled hidden>Mouth</option>                    
                    <option value="Cigarette">Cigarette</option>
                    <option value="Medical Mask">Medical Mask</option>
                    <option value="Pipe">Pipe</option>
                    <option value="Vape">Vape</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Mouth'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="neck">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Neck']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Neck: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Neck</option>                    
                    <option value="Choker">Choker</option>
                    <option value="Gold Chain">Gold Chain</option>
                    <option value="Silver Chain">Silver Chain</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Neck'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="nose">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Nose']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Nose: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Nose</option>                    
                    <option value="Clown Nose">Clown Nose</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Nose'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="sex">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Sex']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Sex: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Sex</option>
                    <option value="Alien">Alien</option>
                    <option value="Ape">Ape</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Zombie">Zombie</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Sex'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="teeth">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Teeth']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Teeth: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Teeth</option>                    
                    <option value="Buck Teeth">Buck Teeth</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Teeth'];
                          return updatedState;
                        });
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="traits">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={f['Traits']||''}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, Traits: e.target.value }));
                    }}
                  >
                    <option value="" disabled hidden>Trait Count</option>
                    <option value="1">0 Trait</option>
                    <option value="2">1 Trait</option>
                    <option value="3">2 Traits</option>
                    <option value="4">3 Traits</option>
                    <option value="5">4 Traits</option>
                    <option value="6">5 Traits</option>
                    <option value="7">6 Traits</option>
                    <option value="8">7 Traits</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState['Traits'];
                          return updatedState;
                        });
                      }} 
                      type="button">x</button>
                  </div>
                </div>
            </div>
          </div>
         <div className="flex flex-wrap justify-center">
            {displayedData.map((phunk) => (
              (displayedData.length > 0 ?
                <Card
                  key={phunk.args.phunkIndex._hex}
                  price={ethers.utils.formatUnits(phunk.args.minValue._hex,18) + "Ξ"}
                  atts=""
                  id={ethers.utils.formatUnits(phunk.args.phunkIndex._hex,0)}
                  coll="philip"
                />
              : null )  
            ))}
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