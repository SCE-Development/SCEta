import React from 'react';
import { formatDateToTime } from '../util/formatDateToTime';

export default function RouteCard({ route, destinations, useDestinationAsName }) {
  return (
    <div className="mb-4">
      <div className="flex flex-row justify-between items-center">
        <div className="col-span-2 my-0 divider" />
        <div className="col-span-2 m-0 divider" />
      </div>
      {Object.entries(destinations).map(([destination, times ]) => (
        <div key={destination}>
          <div className="grid gap-2 grid-cols-[50%_50%] md:grid-cols-[60%_40%] text-xl md:text-2xl">
            <div>
              <b className="md:badge md:badge-md md:badge-lg md:badge-primary md:rounded-md md:h-[3rem] mb-1 text-primary md:text-white text-lg md:text-3xl">{route}</b>
              {useDestinationAsName ? null : (
                <span className="mb-1 text-white text-lg md:text-3xl"> to {destination}</span>
              )}
            </div>
            <span className="text-lg md:text-3xl">
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
