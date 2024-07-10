import React, { useState, useEffect } from 'react';
import { getTransitPredictions } from './APIFunctions/SCEta';
import { formatDateToTime } from './util/formatDateToTime';
import RouteCard from './Components/RouteCard';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

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
        let phoneId = stop.ids.some(id => !isNaN(id)) ? stop.ids.find(id => !isNaN(id)) : null;
        console.log(`Phone ID for ${stop.name}:`, phoneId);
        uniqueStops[encodedHash] = {
          name: stop.name,
          ids: Array.isArray(stop.ids) ? stop.ids : [],
          phoneId: phoneId, 
        };
      });

      // if URL hash exists, set the tab to the encoded stop
      // otherwise, set tab to the first unique stop + add URL hash
      if (!selectedStop && Object.keys(uniqueStops).length > 0) {
        let hash = window.location.hash.replace(/^#/, '');
        if (uniqueStops.hasOwnProperty(hash)) {
          setSelectedStop(uniqueStops[hash].name);
        } else {
          let firstStop = Object.keys(uniqueStops)[0];
          setSelectedStop(uniqueStops[firstStop].name);
          window.location.hash = firstStop;
        }
      }
    }
    setStopOptions(Object.values(uniqueStops));
  }, [busData, selectedStop]);

  const changeTab = (newStop) => {
    setSelectedStop(newStop);
    window.location.hash = encode(newStop);
  };

  //set default marker icon
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });

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
            className="px-4 py-2 text-sm md:text-xl font-semibold border-b-2 outline-none bg-gray-800">
            {stopOptions.map((stop) => (
              <option key={stop.name} value={stop.name}>
                {`${stop.name} `}
              </option>
            ))}
          </select>
        </div>
        {/* Tabs for larger screens */}
        <div className="hidden items-center xl:flex flex-row justify-center space-x-4 overflow-x-auto">
          {stopOptions.map((stop) => (
            <button key={stop.name} className={`px-4 py-2 text-xl font-semibold border-b-2 
            ${selectedStop === stop.name ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:border-gray-300'}`}
              onClick={() => changeTab(stop.name)}>
              {`${stop.name} `}
            </button>
          ))}
        </div>

        <div className="flex flex-col xl:grid xl:grid-cols-[70%_30%] gap-8">
          {!!busData.length && busData.map((stop) => (
            stop.name === selectedStop &&
            <div key={stop.name} className="items-center text-center md:text-left flex flex-col w-full xl:w-full mt-2 p-6 min-w-50 max-h-[65vh] text-xl bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 overflow-y-auto">
              
              <div className="flex justify-center xl:justify-start font-bold text-[1rem] md:text-4xl mb-2 xl:mb-5">
                {stop.name}
              </div>


              <div className="flex justify-center xl:justify-start text-sm md:text-lg text-gray-500 mb-4 xl:mb-6">
                {
                  <>
                    {stop.ids.some(id => !isNaN(id)) && (
                      <a
                        href={`tel:511p1p1,,${stop.ids.find(id => !isNaN(id))}`}
                        className="inline-block px-2 py-1 ml-2 text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700"
                      >
                        CLICK TO CALL
                      </a>
                    )}
                  </>
                }
              </div>

              
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
            <div key={stop.name} className="overflow-visible xl:mr-10 mt-4 items-center">
              <MapContainer center={[stop.latitude, stop.longitude]} zoom={16} className="mx-auto rounded-lg h-[30vh] xl:h-[29em] w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker position={[stop.latitude, stop.longitude]}>
                  <Popup>{stop.name}</Popup>
                </Marker>
              </MapContainer>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
