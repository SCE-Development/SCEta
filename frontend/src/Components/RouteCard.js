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
          <div className="md:grid md:gap-2 xl:grid-cols-[60%_40%] md:grid-cols-[45%_55%] text-xl md:text-2xl md:w-[60vw] w-[70vw]">
            <div>
              <b className=" mb-1 text-primary text-[1rem] md:text-3xl">{route}</b>
              {useDestinationAsName ? null : (
                <span className="mb-1 text-white text-[1rem] md:text-3xl"> to {destination}</span>
              )}
            </div>
            <span className="text-[1rem] md:text-2xl md:text-right">
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
