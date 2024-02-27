import React from 'react';

const formatTimeToDate = (time) => {
  const date = new Date(time);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
};

// filters out stops in the past (used for fixed stop data)
// ex. it's 9PM, so the ACE Train's stop at 3PM shouldn't appear
function getFutureTimes(times) {
  const present = new Date();

  const timeElements = []
  times.forEach((time, timeIndex) => {
    // if the stop time is in the future, add it
    if (new Date(time) > present) {
      timeElements.push(<span key={timeIndex}>{formatTimeToDate(time)} {timeIndex !== times.length - 1 && ', '}</span>);
    }
  });

  return timeElements.length > 0 ? timeElements : (<span className="text-2xl">None</span>);
}

export default function RouteCard({ route, destinations }) {
  return (
    <div className="mb-4">
      <b className="badge badge-lg badge-primary rounded-md h-[3rem] mb-1 text-white text-2xl md:text-3xl">{route}</b>
      <div className="grid gap-x-2 grid-cols-[50%_50%]">
        <div className="col-span-2 my-0 divider"/>
        <span>DESTINATION</span>
        <span>EXPECTED ARRIVALS</span>
        <div className="col-span-2 m-0 divider"/>
      </div>
      {Object.entries(destinations).map(([destination, times]) => (
        <div key={destination}>
          <div className="grid gap-2 grid-cols-[50%_50%] text-2xl">
            <span>{destination}</span>
            <span>
              {getFutureTimes(times)}
            </span>
            <div className="col-span-2 m-0 divider"/>
          </div>
        </div>
      ))}
    </div>
  );
}
