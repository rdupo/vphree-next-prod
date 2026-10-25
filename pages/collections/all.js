import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import CollectionStats from '../../components/CollectionStats'
import useApi from '../../hooks/useApi'

const phunkImage = (id) => `/phunks/phunk${String(id).padStart(4, '0')}.svg`

// Per-collection display settings. Color classes come from globals.css.
// `hover` (optional) swaps the thumbnail's background and image on hover.
const COLLECTIONS = {
  'philip-intern-project': {
    name: 'Philip Intern Project',
    market: '/collections/philip-intern-project',
    detail: 'philip',
    txt: 'philip-txt',
    bg: 'philip-bg',
    border: 'philip-b',
    image: () => '/phunks/philip.png',
    // same as the Philip marketplace cards: reveal the wrapped v1 Phunk on hover
    hover: { bg: 'v1-bg', image: phunkImage },
  },
  'wrapped-v1-phunks': {
    name: 'Wrapped v1 Phunks',
    market: '/collections/wrapped-v1-phunks',
    detail: 'wrapped-v1-phunk',
    txt: 'v1-txt',
    bg: 'v1-bg',
    border: 'v1-b',
    image: phunkImage,
  },
  'v3-phunks': {
    name: 'v3 Phunks',
    market: '/collections/v3-phunks',
    detail: 'v3phunk',
    txt: 'v3-txt',
    bg: 'v3-bg',
    border: 'v3-b',
    image: phunkImage,
  },
}

function PreviewThumb({ c, id }) {
  const [isHovered, setIsHovered] = useState(false)
  const look = isHovered && c.hover ? c.hover : c

  return (
    <Link
      href={`/${c.detail}/${id}`}
      className={`${look.bg} brite`}
      aria-label={`${c.name} #${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Image src={look.image(id)} alt="" width={64} height={64} loading="lazy"/>
    </Link>
  )
}

function CollectionSection({ summary }) {
  const c = COLLECTIONS[summary.collection]

  return (
    <section className={`${c.border} black-bg p-4 mb-8`}>
      <div className="flex flex-wrap items-baseline justify-between mb-2">
        <Link href={c.market}>
          <h2 className={`${c.txt} text-2xl brite`}>{c.name}</h2>
        </Link>
        <Link href={c.market} className={`${c.txt} collection-desc brite`}>View Market &rarr;</Link>
      </div>
      <CollectionStats summary={summary}/>
      {summary.preview.length > 0 ?
        <div className="collection-preview mt-2">
          {summary.preview.map((id) => (
            <PreviewThumb key={id} c={c} id={id}/>
          ))}
        </div>
        :
        <p className="collection-desc text-gray-400 mt-2">Nothing listed right now.</p>
      }
    </section>
  )
}

export default function AllCollections() {
  const { data, loading, error } = useApi('/api/collections/summary')

  return (
    <>
      <Header/>
      <div className="page bg-opacity-60 bg-black">
        <div className="content px-8 z-10">
          <h1 className="g-txt text-5xl pt-8 mb-4">View All Collections</h1>
          <p className="collection-desc w-9/12 mb-8">
            View all collections currently supported by vPhree. You can compare floors and recent activity at a glance, or jump into a collection to browse everything that&apos;s listed.
          </p>
          {loading ? <p className="text-2xl g-txt">Loading collections...</p> : null}
          {error ? <p className="text-2xl text-red-500">Couldn&apos;t load collections. Please try again.</p> : null}
          {(data || []).map((summary) => (
            <CollectionSection key={summary.collection} summary={summary}/>
          ))}
        </div>
      </div>
      <div className="home-bg fixed top-0 left-0 right-0 -z-10"></div>
      <Footer
        bg='black'
      />
    </>
  )
}
