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

  // this does three things
  // 1. replace all non alpha numeric chars in the stop name with dashes
  // 2. replace the character "&" with "and" if it appears
  // 3. convert all characters in the stop to lowercase.
  // for example "Santa Clara & 6th" becomes "santa-clara-and-6th"  
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
      <div className="px-4 py-8 ml-5 mr-5 lg:py-16 lg:px-6 max-w-[100%]">
        <div className="mx-10 mb-8 text-center">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 lg:text-4xl dark:text-white">SCEta's Transit Predictions</h2>
          <p className="font-light text-gray-500 sm:text-xl dark:text-gray-400">Below predictions are up-to-date as of <span className='font-semibold'>{timeAtMount}</span></p>
        </div>
        {/* Dropdown for smaller screens */}
        <div className="xl:hidden flex flex-col justify-center space-x-4 overflow-x-auto">
          <select value={selectedStop} onChange={(e) => changeTab(e.target.value)}
            className="px-4 py-2 text-sm md:text-xl font-semibold border-b-2 outline-none bg-gray-200 dark:bg-gray-800 rounded-lg">
            {stopOptions.map((stopName) => (
              <option key={stopName} value={stopName}>
                {stopName}
              </option>
            ))}
          </select>
        </div>
        {/* Tabs for larger screens */}
        <div className="hidden items-center xl:flex flex-row justify-center space-x-4 overflow-x-auto">
          {stopOptions.map((stopName) => (
            <button key={stopName} className={`px-4 py-2 text-xl font-semibold border-b-2
            ${selectedStop === stopName ? 'border-blue-500 text-blue-500 bg-gray-200 rounded-lg' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
              onClick={() => changeTab(stopName)}>
              {stopName}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[5fr_7fr] xl:gap-7">
          {!!busData.length && busData.map((stop) => (
            stop.name === selectedStop &&
            <div key={stop.name} className="route-predictions-card items-center text-center md:text-left flex flex-col w-full xl:w-full mt-2 p-6 xl:p-5 min-w-50 max-h-[65vh] xl:h-[38rem] xl:max-h-[38rem] text-xl
                bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 overflow-y-auto">
              <div className="stop-name flex justify-center xl:justify-start font-bold mb-5 xl:mb-10">{stop.name}</div>
              {stop.predictions.length === 0 ? (
                <span className="text-2xl">No predictions available at this time</span>
              ) : (
                <div className="w-full">
                  {stop.predictions
                    .sort((a, b) => a.route.localeCompare(b.route))
                    .map((prediction, predictionIndex) => (
                      <RouteCard
                        key={predictionIndex}
                        route={prediction.route}
                        destinations={prediction.destinations}
                        useDestinationAsName={stop.use_destination_as_name}
                        timeAtMount={timeAtMount}
                        /> 
                    ))}
                </div>
              )}
            </div>
          ))}
          {!!busData.length && busData.map((stop) => (
            stop.name === selectedStop &&
            <div key={stop.name} className="mt-4 h-[35vh] items-center overflow-visible xl:mt-2 xl:h-[38rem]">
              <iframe
                title="Stop map"
                sandbox="allow-scripts"
                className="mx-auto h-full w-full rounded-lg border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${stop.longitude - 0.003}%2C${stop.latitude - 0.003}%2C${stop.longitude + 0.003}%2C${stop.latitude + 0.003}&layer=transportmap&marker=${stop.latitude}%2C${stop.longitude}`}
              />


            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
