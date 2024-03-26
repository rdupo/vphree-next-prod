//LatestProp
import { React, useEffect, useState } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';

const fetchData = async () => {
  try {
    const response = await axios.get('https://phunk.cc');
    const $ = cheerio.load(response.data);
    const firstChildText = $('#result').children().first().text(); // Assuming you want the text content of the first child of #result
    return firstChildText;
  } catch (error) {
    console.error('Error fetching data:', error);
    return null;
  }
};

const LatestProp = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then(result => {
      setData(result);
    });
  }, []);

  return (
    <div>
      <h2 className="mt-8 text-2xl">Latest Treasury Prop</h2>
      {data ? <p>{data}</p> : <p>Loading...</p>}
    </div>
  );
};

export default LatestProp;
