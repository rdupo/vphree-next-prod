import { React, useState, useEffect, useMemo } from 'react'
import Router, { useRouter } from 'next/router'
import Image from 'next/image'
import Header from  '../../components/Header'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import Banner from '../../assets/profile-banner.png'
import Profile from '../../assets/profile-icon.png'
import { Silkscreen, Montserrat } from 'next/font/google'
import { Network, Alchemy } from 'alchemy-sdk'
import { ethers } from "ethers"
import { getNFTs } from '../../utils/getNFTs2'
import v3MarketAddy from '../../utils/v3MarketAddy'
import v3MarketAbi from '../../utils/v3MarketAbi'
import toast, {Toaster} from 'react-hot-toast'
import { useWallet } from '../../contexts/WalletContext'
import phunks from '../../utils/phunkData'

export default function V3Phunks() {
  const router = useRouter()
  const alcKey = process.env.NEXT_PUBLIC_API_KEY
  const walletAddy = router.query.addy || ''
  const [nfts, setNFTs] = useState([]);
  const [nftsData, setNFTsData] = useState([]);
  const [pendingWithdrawAmt, setPendingWithdrawAmt] = useState('')
  const marketContract = v3MarketAddy
  const marketAbi = v3MarketAbi
  const provider = new ethers.providers.JsonRpcProvider(`https://eth-mainnet.g.alchemy.com/v2/${alcKey}`, 1);
  const [signer, setSigner] = useState([]);
  const contract = new ethers.Contract(marketContract, marketAbi, provider);
  const { connectedAddress, walletChanged } = useWallet();
  const hourglass = <img className='w-6' src='/hourglass-time.gif' alt='hourglass'/>
  /* -- start filter js -- */
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
  const [fP, setFP] = useState([])
  const [loading, setLoading] = useState(true);

  // Use the useEffect hook to monitor changes to the 'f' state
  useEffect(() => {
    function filterPhunks() {
      console.log('fp: ', fP)
      return nftsData.filter(
        (i) =>
          Object.entries(f).every(([k, v]) => k === 'tokenId' ? i.tokenId.toString().indexOf(v) > -1 : i[k] === v)
      );
    }
    const filteredPhunks = filterPhunks();
    setFP(filteredPhunks);
    console.log('filtered fp: ', fP)
  }, [f, nftsData]);

  const filteredPhunksMemo = useMemo(() => fP, [fP]);

  //toggle class
  const filterToggle = () => {
    setFilterState((current) => !current)
  }
  /* -- end filter js -- */

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

  async function fetchNFTs(x) {
    const thisAddy = x;
    const nftIds = await getNFTs(thisAddy);
    const pWith = await contract.pendingWithdrawals(thisAddy);
    const withEth = Number(Number(pWith._hex)/1000000000000000000).toFixed(3);
    setPendingWithdrawAmt(withEth);
    setNFTs(nftIds);

    //start filtering
    const numericIds = nftIds.map(Number);
    const ownedNfts = phunks.filter(item => numericIds.includes(item.tokenId));
    console.log('owned: ',ownedNfts);
    setNFTsData(ownedNfts);
    console.log('nftsData: ',nftsData);
    //end filtering
  }

  useEffect(() => {
    async function fetchData() {
      await fetchNFTs(router.query.addy);
      setLoading(false);
    }
    fetchData();
  }, [walletAddy, connectedAddress]);

  // Fetch NFTs whenever the wallet changes
  useEffect(() => {
    if (walletChanged) {
      Router.push({pathname: `/account/${connectedAddress}`})
    }
  }, [connectedAddress, walletChanged]);

  //withdraw() function
  async function withdrawMyEth() {
    const mmp = new ethers.providers.Web3Provider(window.ethereum);
    const signer = mmp.getSigner(connectedAddress);
    const cpmp = new ethers.Contract(marketContract, marketAbi, signer);
    const withdrawPromise = cpmp.withdraw();
    txnToast(withdrawPromise, `Withdrawing ${pendingWithdrawAmt}Ξ`);
    await withdrawPromise
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

  //withdraw
  async function withdraw() {
    if(signer) {
      withdrawMyEth()
    }
  }

  return (
    <>
      <Header/>
      <Toaster/>
      <div className="page">
        <div className="content px-8">
        	<h1 className="v3-txt mr-auto text-5xl mt-4">
            <Image
              height={40}
              className="inline-flex align-middle my-3 mr-4 h-img" 
              src={Profile}
              alt="profile icon"
            />
            {walletAddy.substr(0,4) + "..." + walletAddy.substr(walletAddy.length - 4, walletAddy.length)}
          </h1>
          <p className="white-txt text-xl">
            This wallet owns {nfts.length} V3 Phunks.
          </p>
          { connectedAddress === walletAddy && pendingWithdrawAmt > 0 ?
            <div className="my-2">
              <button 
                className="cta b-b bg-[#ffba00] black-txt brite"
                onClick={() => {withdraw()}}
              >
                WITHDRAW {pendingWithdrawAmt}Ξ
              </button>
            </div>
            :
            null
          }
          <div className="filter-sort-wrapper mb-4 mt-8">
            <div>
              <label className="mr-3">ID</label>
              <input 
                type="text" 
                id="id" 
                className="lite-v3-bg black-txt" 
                name="id" 
                minLength="1" 
                maxLength="4" 
                placeholder="Phunk ID..." 
                onChange={(e) => setF((prevState) => ({ ...prevState, tokenId: e.target.value }))}
              />
              <button 
                id="view" 
                className={`v3-bg black-txt brite ${filtersActive ? 'hidden' : ''}`} 
                onClick={filterToggle}>
                View Filters
              </button>
              <button 
                id="hide" 
                className={`v3-bg black-txt brite ${filtersActive ? '' : 'hidden'}`} 
                onClick={filterToggle}>
                Hide Filters
              </button>
            </div>
            <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
                <div className="p-0 filter-dropdown" data-type="beard ">
                  <select 
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg"
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
                    className="select lite-v3-bg" 
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
                      className="btn-outline v3-bg" 
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
        	<div className="flex flex-wrap justify-left">
	            {fP.map((phunk) => (
	            	(typeof(phunk) != 'undefined' ?
	                <Card
                    key={phunk.tokenId}
                    price="" 
                    atts={phunk.atts}
                    id={phunk.tokenId}
                    coll="phunk"
	                />
	              : null )  
	            ))}
        	</div>
        </div>
      </div>
      <Footer/>      
    </>
  )
}