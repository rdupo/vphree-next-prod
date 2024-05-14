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
      setPolls(data.slice(0,3));
      //setYay(data[0].results[0].count);
      //setNay(data[0].results[1].count)
      console.log(polls)
    };

    fetchPolls();
  }, []);

  console.log('Now', Date.now())

  return (
    <div>
      <h2 className="mt-16 mb-4 text-2xl">Latest Treasury Props</h2> 
      {polls.length > 0 ? 
      (
        polls.map((poll) => {
          return(
            <div className="w-10/12 mb-4" key={poll.id}>
              <p className="g-txt">Poll #{poll.id}</p>
              <p className="collection-desc text-gray-300 break-all">{poll.description}</p>
              {new Date(poll.until) > Date.now() ?
                <p className="collection-desc text-gray-300">Ends: {poll.until}</p>
                :
                <div>
                  <p className="collection-desc text-gray-300"><span className="text-white">Ended:</span> {poll.until}</p>
                  {poll.results ? 
                    <p className="collection-desc text-gray-300 inline">
                      <span className="text-white">Results:</span>
                      {poll.results[0] ? <p className="inline">{poll.results[0].vote_value} {poll.results[0].count}</p> : null}
                      {poll.results[1] ? <p className="inline"> | {poll.results[1].vote_value} {poll.results[1].count}</p> : null}
                    </p>
                    :
                    <p className="collection-desc text-gray-300">Results loading...</p>
                  }
                </div>
              }
              <p className="collection-desc">Read the full discussion <a target="_blank" href={poll.link}>here</a>.</p>
            </div>
          )
        })
      )
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
