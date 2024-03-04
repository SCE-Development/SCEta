import React from 'react';
import { formatTime} from '../util/formatTime';

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
              {times.map((time, timeIndex) => (
                <span key={timeIndex}>
                  {formatTime(time)} {timeIndex !== times.length - 1 && ', '}
                </span>
              ))}
            </span>
            <div className="col-span-2 m-0 divider"/>
          </div>
        </div>
      ))}
    </div>
  );
}
