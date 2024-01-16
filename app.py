import collections
from dataclasses import dataclass
import datetime
import json
import logging
import sys
import threading
import time
import typing

from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
import prometheus_client
import requests
import uvicorn
import yaml

from modules.args import get_args
from modules.metrics import MetricsHandler


app = FastAPI()
args = get_args()

with open(args.config, "r") as stream:
    try:
        data = yaml.safe_load(stream)
        API_KEY = data.get("api_key", None)
        cache_update_interval = data.get('cache_update_interval_minutes', 1)
        stops = data.get("stops", {})
    except Exception:
        logging.exception("unable to open yaml file/ file is missing data, exiting")
        sys.exit(1)

logging.Formatter.converter = time.gmtime

formatter = logging.basicConfig(
    format="%(asctime)s.%(msecs)03dZ %(threadName)s %(levelname)s:%(name)s:%(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.ERROR - 10 * args.verbose,
)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

metrics_handler = MetricsHandler.instance()

@dataclass
class Prediction:
  route: str
  destination: str
  times: typing.List[str]

@dataclass
class Stop:
  id: str
  name: str
  predictions: typing.List[Prediction]

@dataclass
class Cache:
  stops: typing.List[Stop]
  updated_at: str

PREDICTIONS_URL = 'https://api.511.org/transit/StopMonitoring'
cache = Cache([], '')
def update_cache():
    agency_to_stop_suffix = {
        "BA": "BART",
    }
    new_stops = []

    # send post request for each agency's stop(s)
    for stop in stops:
        agency = stop.get('operator')
        stopCode = stop.get('id')
        stopName= stop.get('name')
        # We add a suffix to some stop names to add context.
        # For example, the BART stop called "Milpitas" becomes
        # "Milpitas BART"
        if (agency in agency_to_stop_suffix):
            stopName = stopName + " " + agency_to_stop_suffix.get(agency)

        params = {
            'api_key': API_KEY,
            'agency': agency,
            'stopCode': stopCode,
            'format': 'json'
        }

        with MetricsHandler.api_latency.time():
            response = requests.get(PREDICTIONS_URL, params=params)
        logging.debug(f'511`s API response code was {response.status_code}')
        # unsuccessful request to 511 API
        if response.status_code != 200:
            MetricsHandler.api_response_codes.labels(response.status_code).inc() 
            logging.error(f"not parsing response because response code was {response.status_code}")
            time.sleep(10)
            continue

        # successful request to 511 API
        MetricsHandler.api_response_codes.labels(response.status_code).inc() 

        content = response.content.decode('utf-8-sig')
        data = json.loads(content)

        all_incoming_buses = data.get('ServiceDelivery', {}).get('StopMonitoringDelivery', {}).get('MonitoredStopVisit')
        unique_buses: typing.Dict[str, Prediction] = collections.defaultdict(lambda: Prediction("", "", []))
        for bus in all_incoming_buses:
            route_name = bus.get('MonitoredVehicleJourney', {}).get('LineRef')
            route_destination = bus.get('MonitoredVehicleJourney', {}).get('MonitoredCall', {}).get('DestinationDisplay').title()
            expected_arrival = bus.get('MonitoredVehicleJourney', {}).get('MonitoredCall', {}).get('AimedArrivalTime')
            
            route_key = (route_name, route_destination)
            unique_buses[route_key].route = route_name
            unique_buses[route_key].destination = route_destination
            unique_buses[route_key].times.append(expected_arrival)

        stopInfo = Stop(stopCode, stopName, list(unique_buses.values()))
        new_stops.append(stopInfo)

    cache.stops = new_stops
    cache.updated_at = datetime.datetime.now(datetime.timezone.utc)

def helper_thread():
    while True:
        update_cache()
        logging.debug("helper thread updated cache with predictions")
        MetricsHandler.cache_last_updated.set(int(time.time()))
        time.sleep(60 * cache_update_interval)

# middleware to get metrics on HTTP response codes
@app.middleware("http")
async def track_response_codes(request: Request, call_next):
    response = await call_next(request)
    status_code = response.status_code
    MetricsHandler.http_code.labels(request.url.path, status_code).inc()
    return response

@app.get('/predictions')
def predictions():
    return cache

@app.get('/metrics')
def get_metrics():
    return Response(
        media_type='text/plain',
        content=prometheus_client.generate_latest(),
    )

if __name__ == 'app':
    helper = threading.Thread(target=helper_thread, daemon=True)
    helper.start()

if __name__ == '__main__':
    logging.info(f"running on {args.host}, listening on port {args.port}")
    uvicorn.run("app:app", host=args.host, port=args.port, reload=True)
