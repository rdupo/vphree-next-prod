 import { React, useState, useEffect } from 'react'
import Image from 'next/image'
import Header from  '../../components/Header'
import CollectionInfo from '../../components/CollectionInfo'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import Banner from '../../assets/philip-banner.png'
import Twitter from '../../assets/twitter.png'
import Etherscan from '../../assets/etherscan.png'
import { Silkscreen, Montserrat } from 'next/font/google'
import philips from '../../utils/philips'
import philipAddy from '../../utils/philipAddy'

export default function V3Phunks() {
  const collectionContract = philipAddy
  const [f, setF] = useState({})
  const [beard, setBeard] = useState("")
  const [cheeks, setCheeks] = useState("")
  const [ears, setEars] = useState("")
  const [emotion, setEmotion] = useState("")
  const [eyes, setEyes] = useState("")
  const [face, setFace] = useState("")             
  const [hair, setHair] = useState("")
  const [lips, setLips] = useState("")
  const [mouth, setMouth] = useState("")
  const [neck, setNeck] = useState("")
  const [nose, setNose] = useState("")                
  const [sex, setSex] = useState("")  
  const [teeth, setTeeth] = useState("")             
  const [atts, setAtts] = useState("")
  const [filtersActive, setFilterState] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({})
  const [fP, setFP] = useState(philips)
  const phunks = philips
  const philDesc = ["View all 1,004 Philips. Click on a Philip to view it's attribute(s) and buy/bid on it. A preview of the wrapped Philip is displayed on hover. You can wrap your Philip at the", <Link href="/hub/philip-intern-project">Phunky Hub</Link>, "."]

  // Use the useEffect hook to monitor changes to the 'f' state
  useEffect(() => {
    function filterPhunks() {
      return phunks.filter(
        (i) =>
          Object.entries(f).every(([k, v]) => k === 'tokenId' ? i.tokenId.toString().indexOf(v) > -1 : i[k] === v)
      );
    }
    const filteredPhunks = filterPhunks();
    setFP(filteredPhunks);
    console.log(filteredPhunks);
  }, [f]); // The useEffect hook will run whenever 'f' changes

  //toggle class
  const filterToggle = () => {
    setFilterState((current) => !current)
  }

  return (
    <>
      <Header/>
      <div className="page bg-opacity-60 bg-black">
        <div className="banner-wrapper mb-6">
          <Image className="col-banner" src={Banner} width="100%" alt="philip banner"/>
        </div>
        <div className="content px-8 z-10">
          <CollectionInfo
            title="All Philips"
            desc={philDesc}
            twitter="https://twitter.com/CryptoPhunksV1"
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
            </div>
            <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
                <div className="p-0 filter-dropdown" data-type="beard ">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={beard}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, beard: e.target.value }));
                      setBeard(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Beard</option>
                    <option value="NA">None</option>
                    <option value="Big-Beard">Big Beard</option>
                    <option value="Chinstrap">Chinstrap</option>
                    <option value="Front-Beard">Front Beard</option>
                    <option value="Front-Beard-Dark">Front Beard Dark</option>
                    <option value="Goat">Goat</option>
                    <option value="Handlebars">Handlebars</option>
                    <option value="Luxurious-Beard">Luxurious Beard</option>
                    <option value="Mustache">Mustache</option>
                    <option value="Muttonchops">Muttonchops</option>
                    <option value="Normal-Beard">Normal Beard</option>
                    <option value="Normal-Beard-Black">Normal Beard Black</option>
                    <option value="Shadow-Beard">Shadow Beard</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt"
                      onClick={() => {
                        setF((prevState) => {
                          // Create a copy of the state to avoid modifying it directly
                          const updatedState = { ...prevState };
                          // Remove the 'beard' property from the state
                          delete updatedState.beard;
                          // Return the updated state
                          return updatedState;
                        });
                        setBeard("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="cheeks">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={cheeks}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, cheeks: e.target.value }));
                      setCheeks(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Cheeks</option>
                    <option value="NA">None</option>
                    <option value="Rosy-Cheeks">Rosy Cheeks</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.cheeks;
                          return updatedState;
                        });
                        setCheeks("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="ears">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={ears}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, ears: e.target.value }));
                      setEars(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Ears</option>
                    <option value="NA">None</option>
                    <option value="Earring">Earring</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.ears;
                          return updatedState;
                        });
                        setEars("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="emotion">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={emotion}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, emotion: e.target.value }));
                      setEmotion(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Emotion</option>
                    <option value="NA">None</option>
                    <option value="Frown">Frown</option>
                    <option value="Smile">Smile</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.emotion;
                          return updatedState;
                        });
                        setEmotion("");
                      }}  
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="eyes">
                  <select 
                    className="select bg-green-100" 
                    type="text"
                    value={eyes}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, eyes: e.target.value }));
                      setEyes(e.target.value)
                    }}>
                    <option value="" disabled hidden>Eyes</option>
                    <option value="NA">None</option>
                    <option value="3D-Glasses">3D Glasses</option>
                    <option value="Big-Shades">Big Shades</option>
                    <option value="Blue-Eye-Shadow">Blue Eye Shadow</option>
                    <option value="Classic-Shades">Classic Shades</option>
                    <option value="Clown-Eyes-Blue">Clown Eyes Blue</option>
                    <option value="Clown-Eyes-Green">Clown Eyes Green</option>
                    <option value="Eye-Mask">Eye Mask</option>
                    <option value="Eye-Patch">Eye Patch</option>
                    <option value="Green-Eye-Shadow">Green Eye Shadow</option>
                    <option value="Horned-Rim-Glasses">Horned Rim Glasses</option>
                    <option value="Nerd-Glasses">Nerd Glasses</option>
                    <option value="Purple-Eye-Shadow">Purple Eye Shadow</option>
                    <option value="Regular-Shades">Regular Shades</option>
                    <option value="Small-Shades">Small Shades</option>
                    <option value="VR">VR</option>
                    <option value="Welding-Goggles">Welding Goggles</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.eyes;
                          return updatedState;
                        });
                        setEyes("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="face">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={face}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, face: e.target.value }));
                      setFace(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Face</option>
                    <option value="NA">None</option>
                    <option value="Mole">Mole</option>
                    <option value="Spots">Spots</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.face;
                          return updatedState;
                        });
                        setFace("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="hair">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={hair}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, hair: e.target.value }));
                      setHair(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Hair</option>
                    <option value="NA">None</option>
                    <option value="Bandana">Bandana</option>
                    <option value="Beanie">Beanie</option>
                    <option value="Blonde-Bob">Blonde Bob</option>
                    <option value="Blonde-Short">Blonde Short</option>
                    <option value="Cap">Cap</option>
                    <option value="Cap-Forward">Cap Forward</option>
                    <option value="Clown-Hair-Green">Clown Hair Green</option>
                    <option value="Cowboy-Hat">Cowboy Hat</option>
                    <option value="Crazy-Hair">Crazy Hair</option>
                    <option value="Dark-Hair">Dark Hair</option>
                    <option value="Do-rag">Do-rag</option>
                    <option value="Fedora">Fedora</option>
                    <option value="Frumpy-Hair">Frumpy Hair</option>
                    <option value="Half-Shaved">Half Shaved</option>
                    <option value="Headband">Headband</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Knitted-Cap">Knitted Cap</option>
                    <option value="Messy-Hair">Messy Hair</option>
                    <option value="Mohawk">Mohawk</option>
                    <option value="Mohawk-Dark">Mohawk Dark</option>
                    <option value="Mohawk-Thin">Mohawk Thin</option>
                    <option value="Orange-Side">Orange Side</option>
                    <option value="Peak-Spike">Peak Spike</option>
                    <option value="Pigtails">Pigtails</option>
                    <option value="Pilot-Helmet">Pilot Helmet</option>
                    <option value="Pink-With-Hat">Pink With Hat</option>
                    <option value="Police-Cap">Police Cap</option>
                    <option value="Purple-Hair">Purple Hair</option>
                    <option value="Red-Mohawk">Red Mohawk</option>
                    <option value="Shaved-Head">Shaved Head</option>
                    <option value="Straight-Hair">Straight Hair</option>
                    <option value="Straight-Hair-Blonde">Straight Hair Blonde</option>
                    <option value="Straight-Hair-Dark">Straight Hair Dark</option>
                    <option value="Stringy-Hair">Stringy Hair</option>
                    <option value="Tassle-Hat">Tassle Hat</option>
                    <option value="Tiara">Tiara</option>
                    <option value="Top-Hat">Top Hat</option>
                    <option value="Vampire-Hair">Vampire Hair</option>
                    <option value="Wild-Blonde">Wild Blonde</option>
                    <option value="Wild-Hair">Wild Hair</option>
                    <option value="Wild-White-Hair">Wild White Hair</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.hair;
                          return updatedState;
                        });
                        setHair("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="lips">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={lips}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, lips: e.target.value }));
                      setLips(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Lips</option>
                    <option value="NA">None</option>
                    <option value="Black-Lipstick">Black Lipstick</option>
                    <option value="Hot-Lipstick">Hot Lipstick</option>
                    <option value="Purple-Lipstick">Purple Lipstick</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.lips;
                          return updatedState;
                        });
                        setLips("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="mouth">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={mouth}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, mouth: e.target.value }));
                      setMouth(e.target.value)
                    }}
                    >
                    <option value="" disabled hidden>Mouth</option>
                    <option value="NA">None</option>
                    <option value="Cigarette">Cigarette</option>
                    <option value="Medical-Mask">Medical Mask</option>
                    <option value="Pipe">Pipe</option>
                    <option value="Vape">Vape</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.mouth;
                          return updatedState;
                        });
                        setMouth("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="neck">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={neck}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, neck: e.target.value }));
                      setNeck(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Neck</option>
                    <option value="NA">None</option>
                    <option value="Choker">Choker</option>
                    <option value="Gold-Chain">Gold Chain</option>
                    <option value="Silver-Chain">Silver Chain</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.neck;
                          return updatedState;
                        });
                        setNeck("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="nose">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={nose}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, nose: e.target.value }));
                      setNose(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Nose</option>
                    <option value="NA">None</option>
                    <option value="Clown-Nose">Clown Nose</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.nose;
                          return updatedState;
                        });
                        setNose("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="sex">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={sex}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, sex: e.target.value }));
                      setSex(e.target.value)
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
                          delete updatedState.sex;
                          return updatedState;
                        });
                        setSex("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="teeth">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={teeth}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, teeth: e.target.value }));
                      setTeeth(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Teeth</option>
                    <option value="NA">None</option>
                    <option value="Buck-Teeth">Buck Teeth</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.teeth;
                          return updatedState;
                        });
                        setTeeth("");
                      }}
                      type="button">x</button>
                  </div>
                </div>
                <div className="p-0 filter-dropdown" data-type="traits">
                  <select 
                    className="select bg-green-100" 
                    type="text" 
                    value={atts}
                    onChange={(e) => {
                      setF((prevState) => ({ ...prevState, atts: e.target.value }));
                      setAtts(e.target.value)
                    }}
                  >
                    <option value="" disabled hidden>Trait Count</option>
                    <option value="0">0 Trait</option>
                    <option value="1">1 Trait</option>
                    <option value="2">2 Traits</option>
                    <option value="3">3 Traits</option>
                    <option value="4">4 Traits</option>
                    <option value="5">5 Traits</option>
                    <option value="6">6 Traits</option>
                    <option value="7">7 Traits</option>
                  </select>
                  <div className="input-group-append">
                    <button 
                      className="btn-outline g-bg black-txt" 
                      onClick={() => {
                        setF((prevState) => {
                          const updatedState = { ...prevState };
                          delete updatedState.atts;
                          return updatedState;
                        });
                        setAtts("");
                      }} 
                      type="button">x</button>
                  </div>
                </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center">
            {fP.map((phunk) => (
              (typeof(phunk) != 'undefined' ?
                <Card
                  key={phunk.tokenId}
                  price=""
                  atts={phunk.atts}
                  id={phunk.tokenId}
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