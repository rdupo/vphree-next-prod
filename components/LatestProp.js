import { useEffect, useState } from 'react';

function LatestProp() {
  const [polls, setPolls] = useState([]);
  const [yay, setYay] = useState();
  const [nay, setNay] = useState();
  const [nftEstimate, setNftEstimate] = useState(null);

  useEffect(() => {
    const fetchPolls = async () => {
      const res = await fetch('/api/polls');
      const data = await res.json();
      setPolls(data[0]);
      setYay(data[0].results[0].count);
      setNay(data[0].results[1].count)
    };

    fetchPolls();
  }, []);

  return (
    <div>
      <h2 className="mt-8 text-2xl">Latest Treasury Prop</h2>
      {polls ? 
        <div className="w-10/12">
          <p className="v3-txt">Poll #{polls.id}</p>
          <p className="collection-desc text-gray-300 break-all">{polls.description}</p>
          {polls.until > Date.now() ?
            <p className="collection-desc text-gray-300">Ends: {polls.until}</p>
            :
            <div>
              <p className="collection-desc text-gray-300"><span className="text-white">Ended:</span> {polls.until}</p>
              <p className="collection-desc text-gray-300"><span className="text-white">Results:</span> 👍 {yay} | 👎 {nay}</p>
            </div>
          }
          <p className="collection-desc">Read the full discussion <a target="_blank" href={polls.link}>here</a>.</p>
        </div> 
        : 
        <p>Loading...</p>
      }
      <p className="mt-2">To view previous props or vote, visit 
        <a target="_blank" href="https://phunk.cc"> phunk.cc</a>
      </p>
    </div>
  );
}

export default LatestProp;
