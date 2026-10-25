import { useState, useMemo } from 'react'
import { FaAngleDown, FaAngleUp } from 'react-icons/fa6'
import Card from '../components/Card.js'
import phunks from '../utils/phunkData'

// Trait dropdowns: [key in phunkData, label, [value, label] options]. Edit here to add/rename options.
const TRAITS = [
  ['beard', 'Beard', [['NA', 'None'], ['Big-Beard', 'Big Beard'], ['Chinstrap', 'Chinstrap'], ['Front-Beard', 'Front Beard'], ['Front-Beard-Dark', 'Front Beard Dark'], ['Goat', 'Goat'], ['Handlebars', 'Handlebars'], ['Luxurious-Beard', 'Luxurious Beard'], ['Mustache', 'Mustache'], ['Muttonchops', 'Muttonchops'], ['Normal-Beard', 'Normal Beard'], ['Normal-Beard-Black', 'Normal Beard Black'], ['Shadow-Beard', 'Shadow Beard']]],
  ['cheeks', 'Cheeks', [['NA', 'None'], ['Rosy-Cheeks', 'Rosy Cheeks']]],
  ['ears', 'Ears', [['NA', 'None'], ['Earring', 'Earring']]],
  ['emotion', 'Emotion', [['NA', 'None'], ['Frown', 'Frown'], ['Smile', 'Smile']]],
  ['eyes', 'Eyes', [['NA', 'None'], ['3D-Glasses', '3D Glasses'], ['Big-Shades', 'Big Shades'], ['Blue-Eye-Shadow', 'Blue Eye Shadow'], ['Classic-Shades', 'Classic Shades'], ['Clown-Eyes-Blue', 'Clown Eyes Blue'], ['Clown-Eyes-Green', 'Clown Eyes Green'], ['Eye-Mask', 'Eye Mask'], ['Eye-Patch', 'Eye Patch'], ['Green-Eye-Shadow', 'Green Eye Shadow'], ['Horned-Rim-Glasses', 'Horned Rim Glasses'], ['Nerd-Glasses', 'Nerd Glasses'], ['Purple-Eye-Shadow', 'Purple Eye Shadow'], ['Regular-Shades', 'Regular Shades'], ['Small-Shades', 'Small Shades'], ['VR', 'VR'], ['Welding-Goggles', 'Welding Goggles']]],
  ['face', 'Face', [['NA', 'None'], ['Mole', 'Mole'], ['Spots', 'Spots']]],
  ['hair', 'Hair', [['NA', 'None'], ['Bandana', 'Bandana'], ['Beanie', 'Beanie'], ['Blonde-Bob', 'Blonde Bob'], ['Blonde-Short', 'Blonde Short'], ['Cap', 'Cap'], ['Cap-Forward', 'Cap Forward'], ['Clown-Hair-Green', 'Clown Hair Green'], ['Cowboy-Hat', 'Cowboy Hat'], ['Crazy-Hair', 'Crazy Hair'], ['Dark-Hair', 'Dark Hair'], ['Do-rag', 'Do-rag'], ['Fedora', 'Fedora'], ['Frumpy-Hair', 'Frumpy Hair'], ['Half-Shaved', 'Half Shaved'], ['Headband', 'Headband'], ['Hoodie', 'Hoodie'], ['Knitted-Cap', 'Knitted Cap'], ['Messy-Hair', 'Messy Hair'], ['Mohawk', 'Mohawk'], ['Mohawk-Dark', 'Mohawk Dark'], ['Mohawk-Thin', 'Mohawk Thin'], ['Orange-Side', 'Orange Side'], ['Peak-Spike', 'Peak Spike'], ['Pigtails', 'Pigtails'], ['Pilot-Helmet', 'Pilot Helmet'], ['Pink-With-Hat', 'Pink With Hat'], ['Police-Cap', 'Police Cap'], ['Purple-Hair', 'Purple Hair'], ['Red-Mohawk', 'Red Mohawk'], ['Shaved-Head', 'Shaved Head'], ['Straight-Hair', 'Straight Hair'], ['Straight-Hair-Blonde', 'Straight Hair Blonde'], ['Straight-Hair-Dark', 'Straight Hair Dark'], ['Stringy-Hair', 'Stringy Hair'], ['Tassle-Hat', 'Tassle Hat'], ['Tiara', 'Tiara'], ['Top-Hat', 'Top Hat'], ['Vampire-Hair', 'Vampire Hair'], ['Wild-Blonde', 'Wild Blonde'], ['Wild-Hair', 'Wild Hair'], ['Wild-White-Hair', 'Wild White Hair']]],
  ['lips', 'Lips', [['NA', 'None'], ['Black-Lipstick', 'Black Lipstick'], ['Hot-Lipstick', 'Hot Lipstick'], ['Purple-Lipstick', 'Purple Lipstick']]],
  ['mouth', 'Mouth', [['NA', 'None'], ['Cigarette', 'Cigarette'], ['Medical-Mask', 'Medical Mask'], ['Pipe', 'Pipe'], ['Vape', 'Vape']]],
  ['neck', 'Neck', [['NA', 'None'], ['Choker', 'Choker'], ['Gold-Chain', 'Gold Chain'], ['Silver-Chain', 'Silver Chain']]],
  ['nose', 'Nose', [['NA', 'None'], ['Clown-Nose', 'Clown Nose']]],
  ['sex', 'Sex', [['Alien', 'Alien'], ['Ape', 'Ape'], ['Female', 'Female'], ['Male', 'Male'], ['Zombie', 'Zombie']]],
  ['teeth', 'Teeth', [['NA', 'None'], ['Buck-Teeth', 'Buck Teeth']]],
  ['atts', 'Trait Count', [['0', '0 Trait'], ['1', '1 Trait'], ['2', '2 Traits'], ['3', '3 Traits'], ['4', '4 Traits'], ['5', '5 Traits'], ['6', '6 Traits'], ['7', '7 Traits']]],
]

const phunksById = new Map(phunks.map((p) => [p.tokenId, p]))

/**
 * One set of filters applied to every collection section.
 * sections: [{ key, title, coll, ids }] where coll is the <Card> collection code and ids are owned token IDs.
 */
const Filter = ({ sections }) => {
  const [f, setF] = useState({})
  const [filtersActive, setFilterState] = useState(false)
  const [collapsed, setCollapsed] = useState({})

  const setFilter = (key, value) => {
    setF((prevState) => {
      const updatedState = { ...prevState };
      if (value === '') delete updatedState[key];
      else updatedState[key] = value;
      return updatedState;
    });
  }

  const filteredSections = useMemo(() => {
    const matches = (p) =>
      Object.entries(f).every(([k, v]) => k === 'tokenId' ? p.tokenId.toString().indexOf(v) > -1 : p[k] === v);
    return sections
      .filter((s) => s.ids.length > 0)
      .map((s) => ({ ...s, phunks: s.ids.map((id) => phunksById.get(id)).filter((p) => p && matches(p)) }));
  }, [sections, f]);

  const activeCount = Object.keys(f).filter((k) => f[k] !== '').length;

  return (
   <>
    {/* same markup/classes as the filters on the /collections and /view-all pages */}
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
          value={f.tokenId || ''}
          onChange={(e) => setFilter('tokenId', e.target.value)}
        />
        <button
          id={filtersActive ? 'hide' : 'view'}
          className="g-bg black-txt brite"
          onClick={() => setFilterState((current) => !current)}>
          {filtersActive ? 'Hide Filters' : 'View Filters'}
        </button>
        {activeCount > 0 ?
          <button className="g-bg black-txt brite sorter" onClick={() => setF({})}>Clear All ({activeCount})</button>
          : null}
      </div>
      <div id="filters" className={`${filtersActive ? '' : 'hidden'}`}>
        {TRAITS.map(([key, label, options]) => (
          <div key={key} className="p-0 filter-dropdown" data-type={key}>
            <select
              className="select bg-green-100"
              value={f[key] || ''}
              onChange={(e) => setFilter(key, e.target.value)}
            >
              <option value="" disabled hidden>{label}</option>
              {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
            <div className="input-group-append">
              <button
                className="btn-outline g-bg black-txt"
                onClick={() => setFilter(key, '')}
                type="button">x</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    {filteredSections.map((s) => (
      <div key={s.key} className="mt-6">
        <div className="block">
          <h2
            className="inline text-2xl cursor-pointer mb-2"
            onClick={() => setCollapsed((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
          >
            {s.title} <span className="text-gray-400 text-lg">({activeCount > 0 ? `${s.phunks.length} of ${s.ids.length}` : s.ids.length})</span>
          </h2>
          {collapsed[s.key] ? <FaAngleUp className="inline m-1 pb-1"/> : <FaAngleDown className="inline m-1 pb-1"/>}
        </div>
        {collapsed[s.key] ? null :
          (s.phunks.length > 0 ?
            <div className="flex flex-wrap justify-start mt-4">
              {s.phunks.map((phunk) => (
                <Card
                  key={phunk.tokenId}
                  price=""
                  atts={phunk.atts}
                  id={phunk.tokenId}
                  coll={s.coll}
                />
              ))}
            </div>
            :
            <p className="text-gray-400 mt-2">No {s.title} match these filters.</p>
          )
        }
      </div>
    ))}
   </>
  );
};

export default Filter;
