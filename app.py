import logging
import sys
import threading
import time
import typing
from dataclasses import dataclass

from fastapi import FastAPI, Response, Request
from fastapi.middleware.cors import CORSMiddleware
import json
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
        stops = data.get("stops", {})
    except Exception:
        logging.exception("unable to open yaml file/ file is missing data, exiting")
        sys.exit(1)

logging.Formatter.converter = time.gmtime

formatter = logging.basicConfig(
    format="%(asctime)s.%(msecs)03dZ %(threadName)s %(levelname)s:%(name)s:%(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.INFO,
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
  times: typing.List[str]

@dataclass
class Stop:
  id: str
  name: str
  predictions: typing.List[Prediction]

PREDICTIONS_URL = 'https://api.511.org/transit/StopMonitoring'
cache = []
def update_cache():
    # clear cache of any previous (now outdated) data
    cache.clear()
    # send post request for each agency's stop(s)
    for stop in stops:
        agency = stop.get('operator')
        stopCode = stop.get('id')
        stopName= stop.get('name')

        params = {
            'api_key': API_KEY,
            'agency': agency,
            'stopCode': stopCode,
            'format': 'json'
        }

        with MetricsHandler.api_latency.time():
            response = requests.get(PREDICTIONS_URL, params=params)

        # unsuccessful request to 511 API
        if response.status_code != 200:
            MetricsHandler.api_response_codes.labels(response.status_code).inc() 
            logging.error(f"not parsing response because response code was {response.status_code}")
            sys.exit(1)

        # successful request to 511 API
        MetricsHandler.api_response_codes.labels(response.status_code).inc() 

        content = response.content.decode('utf-8-sig')
        data = json.loads(content)

        all_incoming_buses = data.get('ServiceDelivery', {}).get('StopMonitoringDelivery', {}).get('MonitoredStopVisit')
        unique_buses = {}
        for bus in all_incoming_buses:
            MetricsHandler.predictions_count.inc()
            route_name = bus.get('MonitoredVehicleJourney', {}).get('LineRef')
            expected_arrival = bus.get('MonitoredVehicleJourney', {}).get('MonitoredCall', {}).get('AimedArrivalTime')
            
            if route_name not in unique_buses:
                unique_buses[route_name] = []
                
            unique_buses[route_name].append(expected_arrival)

        # for each unique bus, make a prediction object
        predictions = []
        for bus in unique_buses:
            pred = Prediction(
                bus,
                unique_buses[bus]
            )
            predictions.append(pred)

        MetricsHandler.stops_count.inc()
        stopInfo = Stop(stopCode, stopName, predictions)
        cache.append(stopInfo)
        
    return

def helper_thread():
    while True:
        update_cache()
        logging.debug("helper thread updated cache with predictions")
        MetricsHandler.cache_last_updated.set(int(time.time()))
        time.sleep(60*10)

# middleware to get metrics on HTTP response codes
@app.middleware("http")
async def track_response_codes(request: Request, call_next):
    response = await call_next(request)
    status_code = response.status_code
    MetricsHandler.http_code.labels(request.url.path, status_code).inc(1)
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
