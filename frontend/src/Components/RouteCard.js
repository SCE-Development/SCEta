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
          <div className="grid gap-2 md:gap-2 xl:grid-cols-[60%_40%] md:grid-cols-[45%_55%] w-full min-w-0">
            <div className="min-w-0 whitespace-nowrap">
              <div className="inline-flex items-center gap-2">
                <b className="route-card-label inline-flex items-center align-middle text-primary">{route}</b>
                {useDestinationAsName ? null : (
                  <>
                    <span aria-hidden="true" className="route-card-label text-black dark:text-white">→</span>
                    <span className="route-card-label text-black dark:text-white">{destination}</span>
                  </>
                )}
              </div>
            </div>
            <span className="route-card-times whitespace-nowrap md:text-right">
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
