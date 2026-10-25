import Router from 'next/router';

// Phunky Hub secondary nav. `active` is the hub slug of the current page; each item lights up in
// its collection's color (vPhree uses the site green).
const ITEMS = [
  { slug: 'philip-intern-project', label: 'Philips', activeClass: 'text-[#a79aff]' },
  { slug: 'cryptophunks', label: 'CryptoPhunks', activeClass: 'text-[#75a8c2]' },
  { slug: 'v3phunks', label: 'v3Phunks', activeClass: 'text-[#83dfb2]' },
  { slug: 'vphree', label: 'vPhree', activeClass: 'text-[#13df05]' },
];

const HubNav = ({ active }) => (
  <div className="hub-picker-div divide-x-2 divide-gray-500 text-gray-500">
    {ITEMS.map((item, i) => (
      <p
        key={item.slug}
        className={`hub-picker mt-6 ${i === 0 ? 'pr-4' : 'px-4'} text-3xl cursor-pointer ${active === item.slug ? item.activeClass : ''}`}
        onClick={() => Router.push({ pathname: `/hub/${item.slug}` })}
      >{item.label}</p>
    ))}
  </div>
);

export default HubNav;
