import React, { useState, useEffect } from 'react';
import { getTransitPredictions } from './APIFunctions/SCEta';
import { formatDateToTime } from './util/formatDateToTime';
import RouteCard from './Components/RouteCard';

export default function TransitPredictionsPage() {
  const [error, setError] = useState();
  const [busData, setBusData] = useState([]);
  const [timeAtMount, setTimeAtMount] = useState();
  const [selectedStop, setSelectedStop] = useState();
  const [stopOptions, setStopOptions] = useState([]);

  async function getSCEtaPredictions() {
    const predictions = await getTransitPredictions();
    if (predictions.error) {
      setError(predictions.responseData);
    } else {
      setBusData(predictions.responseData.stops);
      setTimeAtMount(formatDateToTime(predictions.responseData.updated_at));
    }
  }

  useEffect(() => {
    getSCEtaPredictions();
  }, []);

  function encode(stopName) {
    return stopName.replace(/\s+/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  }

  // get stopOptions
  useEffect(() => {
    let uniqueStops = {};
    if (busData) {
      // get unique stop options
      busData.forEach((stop) => {
        let encodedHash = encode(stop.name);
        if (!uniqueStops.hasOwnProperty(encodedHash)) {
          uniqueStops[encodedHash] = stop.name;
        }
      });

      // if URL hash exists, set the tab to the encoded stop
      // otherwise, set tab to the first unique stop + add URL hash
      if (!selectedStop && Object.keys(uniqueStops).length > 0) {
        let hash = window.location.hash.replace(/^#/, '')
        if (uniqueStops.hasOwnProperty(hash)) {
          setSelectedStop(uniqueStops[hash])
        } else {
          let firstStop = Object.keys(uniqueStops)[0];
          setSelectedStop(uniqueStops[firstStop]);
          window.location.hash = firstStop
        }
      }
    }
    setStopOptions(Object.values(uniqueStops));
  }, [busData, selectedStop]);

  const changeTab = (newStop) => {
    setSelectedStop(newStop);
    window.location.hash = encode(newStop)
  };

  if (error) {
    return (
      <section className="bg-white dark:bg-gray-900 min-h-[calc(100vh)] ">
        <div className="px-4 py-8 mx-auto lg:py-16 lg:px-6 max-w-7xl">
          <div className="mx-10 mb-8 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white">SCEta's Transit Predictions</h2>
          </div>
          <div className="flex flex-col m-4 p-6 min-w-80 max-h-[50vh] text-xl overflow-y-auto
            bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
            <span className="text-center"><b>Unable to load SCEta transit predictions</b></span>
          </div>
          <p className="mt-8 font-light text-center text-gray-500 sm:text-xl dark:text-gray-400">Transit information is retrieved from 511 SF Bay's Portal for Open Transit Data</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white dark:bg-gray-900 min-h-[calc(100vh)] ">
      <div className="px-4 py-8 mx-auto lg:py-16 lg:px-6 max-w-7xl">
        <div className="mx-10 mb-8 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white">SCEta's Transit Predictions</h2>
          <p className="font-light text-gray-500 sm:text-xl dark:text-gray-400">Below predictions are up-to-date as of <span className='font-semibold'>{timeAtMount}</span></p>
        </div>
        {/* Dropdown for smaller screens */}
        <div className="md:hidden flex flex-col justify-center space-x-4 overflow-x-auto">
          <select value={selectedStop} onChange={(e) => changeTab(e.target.value)}
            className="px-4 py-2 text-xl font-semibold border-b-2 outline-none bg-gray-800">
            {stopOptions.map((stopName) => (
              <option key={stopName} value={stopName}>
                {stopName}
              </option>
            ))}
          </select>
        </div>
        {/* Tabs for larger screens */}
        <div className="hidden md:flex flex-row justify-center space-x-4 overflow-x-auto">
          {stopOptions.map((stopName, index) => (
            <button key={index} className={`px-4 py-2 text-xl font-semibold border-b-2 
            ${selectedStop === stopName ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
            onClick={() => changeTab(stopName)}>
              {stopName}
            </button>
          ))}
        </div>
        <div>
          {!!busData.length && busData.map((stop, index) => (
            stop.name === selectedStop &&
              <div key={index} className="flex flex-col mt-4 p-6 min-w-80 max-h-[55vh] text-xl overflow-y-auto
                bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700">
                <div key={stop.name} className="font-bold text-4xl mb-10">{stop.name}</div>
                {stop.predictions.length === 0 ? (
                  <span className="text-2xl">No predictions available at this time</span>
                ) : (
                  <div>
                    {stop.predictions
                      .sort((a, b) => a.route.localeCompare(b.route))
                      .map((prediction, predictionIndex) => (
                        <RouteCard
                          key={predictionIndex}
                          route={prediction.route}
                          destinations={prediction.destinations}
                        />
                      ))}
                  </div>
                )}
              </div>
          ))}
        </div>
      </div>
    </section>
  );
}
