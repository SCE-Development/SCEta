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
        grouped_stops = data.get("grouped_stops", {})
    except Exception:
        logging.exception("unable to open yaml file/ file is missing data, exiting")
        sys.exit(1)

fixed_stops = []
try:
    with open(args.fixed_stops, "r") as stream:
        fixed_stops = json.load(stream)
except FileNotFoundError:
    logging.debug("JSON file with fixed stops was not provided, skipping")
except Exception:
    logging.exception("unable to load JSON file")

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
  destinations: typing.Dict[str, typing.List[str]]

@dataclass
class Stop:
  ids: typing.List[str]
  name: str
  predictions: typing.List[Prediction]

@dataclass
class Cache:
  stops: typing.List[Stop]
  updated_at: str
  
PREDICTIONS_URL = 'https://api.511.org/transit/StopMonitoring'
cache = Cache([], '')
def update_cache():
    new_stops = []
    now = datetime.datetime.now(datetime.timezone.utc)

    # send post request for each agency's stop(s)
    for stop in stops:
        # get predictions for individual stop
        stop_name = add_suffix_to_name(stop)
        stop_info = get_stop_predictions([stop.get('id')], stop.get('operator'), stop_name, stop.get('use_destination_as_name', False))
        new_stops.append(stop_info)

    for group in grouped_stops:
        stop_info = get_stop_predictions(group.get('ids'), group.get('operator'), group.get('group_name'), group.get('use_destination_as_name', False))

        if group.get('timetables'):
            for timetable in group.get('timetables', []):
                if predictions := get_fixed_stops_predictions(now, timetable.get('route_name'), timetable.get('destination')):
                    stop_info.predictions.append(predictions)

        new_stops.append(stop_info)

    cache.stops = new_stops
    cache.updated_at = now

def get_stop_predictions(stop_ids, operator, stop_name, use_destination_as_name=False):
    unique_buses: typing.Dict[str, Prediction] = collections.defaultdict(lambda: Prediction("", collections.defaultdict(list)))

    for stop_id in stop_ids:
        params = {
            'api_key': API_KEY,
            'agency': operator,
            'stopCode': stop_id,
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
        for bus in all_incoming_buses:
            if use_destination_as_name:
                route_name = bus.get('MonitoredVehicleJourney', {}).get('DestinationName')
            else:
                route_name = bus.get('MonitoredVehicleJourney', {}).get('LineRef')
            expected_arrival = bus.get('MonitoredVehicleJourney', {}).get('MonitoredCall', {}).get('AimedArrivalTime')
            route_destination = bus.get('MonitoredVehicleJourney', {}).get('MonitoredCall', {}).get('DestinationDisplay')
            if route_destination is None:
                MetricsHandler.null_destinations_seen.labels(stop_id).inc()
                route_destination = 'Unknown Destination'
            
            # cast to String in case destination is a different data type
            route_destination = str(route_destination).title()

            unique_buses[route_name].route = route_name
            unique_buses[route_name].destinations[route_destination].append(expected_arrival)

    stop_info = Stop(stop_ids, stop_name, list(unique_buses.values()))
    return stop_info

def get_fixed_stops_predictions(now, route, destination):
    filtered_times = []
    TIMESTAMP_FORMAT = "%H:%M:%S"

    # since ACE doesn't run on the weekend, skip ACE predictions if it is the weekend
    pst_day = (now - datetime.timedelta(hours=8)).weekday()
    if route == 'ACE Train' and (pst_day > 4): # 5 --> saturday, 6 --> sunday
        return None

    for time in fixed_stops:
        dt = datetime.datetime.strptime(time, TIMESTAMP_FORMAT).replace(tzinfo=datetime.timezone.utc)

        # give the parsed departure time a date of today
        dt = dt.replace(day=now.day, month=now.month, year=now.year)
        diff = dt - now

        # if the departure appears to be BEFORE the present moment
        # move the departure time ahead a day.
        # for example, it was 4 PM Pacific (11 pm UTC) and we observed the next
        # train (12 am UTC) before. this is wrong. so we should interpret the
        # next train as coming tomorrow in UTC and recalculate the diff
        if diff.days < 0:
            dt += datetime.timedelta(days=1)
            diff = dt - now

        # if the difference is positive and under 120 minutes, add it
        if 0 < diff.seconds // 60 < 120:
            filtered_times.append(dt)

    return Prediction(route, {destination: filtered_times}) if filtered_times else None

def add_suffix_to_name(stop):
    agency_to_stop_suffix = {
        "BA": "BART",
    }

    agency = stop.get('operator')
    stop_name = stop.get("name")
    # We add a suffix to some stop names to add context.
    # For example, the BART stop called "Milpitas" becomes
    # "Milpitas BART"
    if (agency in agency_to_stop_suffix):
        stop_name = stop_name + " " + agency_to_stop_suffix.get(agency)
    
    return stop_name

def helper_thread():
    while True:
        try:
            update_cache()
            logging.debug("helper thread updated cache with predictions")
            MetricsHandler.cache_last_updated.set(int(time.time()))
        except Exception:
            logging.exception("Unable to update cache")
            MetricsHandler.cache_update_errors.inc()
        finally:
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