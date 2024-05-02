import React from 'react';
import { formatDateToTime } from '../util/formatDateToTime';

export default function RouteCard({ route, destinations, useDestinationAsName, timeAtMount }) {
  return (
    <div className="mb-4">
      <div className="flex flex-row justify-between items-center">
        <div className="col-span-2 my-0 divider" />
        <div className="col-span-2 m-0 divider" />
      </div>
      {Object.entries(destinations).map(([destination, times ]) => (
        <div key={destination}>
          <div className="grid gap-2 grid-cols-[45%_55%] md:grid-cols-[45%_55%] text-xl md:text-2xl w-[60vw]">
            <div>
              <b className=" mb-1 text-primary text-[1rem] md:text-3xl">{route}</b>
              {useDestinationAsName ? null : (
                <span className="mb-1 text-white text-[1rem] md:text-3xl"> to {destination}</span>
              )}
            </div>
            <span className="text-[1rem] md:text-2xl">
              {times.map((time, timeIndex) => (
                <span key={timeIndex}>
                  {formatDateToTime(time)} {timeIndex !== times.length - 1 && ', '}
                </span>
              ))}
            </span>
            <div className="col-span-2 m-0 divider" />
          </div>
        </div>
      ))}
    </div>
  );
}
