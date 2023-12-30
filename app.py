from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataclasses import dataclass
from args import get_args
import typing
import requests
import json
import uvicorn
import threading
import logging
import time
import yaml
import sys


app = FastAPI()
args = get_args()

with open(args.config, "r") as stream:
    try:
        data = yaml.safe_load(stream)
        API_KEY = data.get("api_key", None)
        stops = data.get("stops", {})
    except Exception as error:
        logging.error(error)
        sys.exit(1)

logging.Formatter.converter = time.gmtime

formatter = logging.basicConfig(
    format="%(asctime)s.%(msecs)03dZ %(threadName)s %(levelname)s:%(name)s:%(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    level=logging.ERROR,
)

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

        response = requests.get(PREDICTIONS_URL, params=params)

        if response.status_code != 200:
            logging.error(f"not parsing response because response code was {response.status_code}")

        content = response.content.decode('utf-8-sig')
        data = json.loads(content)

        all_incoming_buses = data.get('ServiceDelivery', {}).get('StopMonitoringDelivery', {}).get('MonitoredStopVisit')
        unique_buses = {}
        for bus in all_incoming_buses:
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
            
        stopInfo = Stop(stopCode, stopName, predictions)
        cache.append(stopInfo)
        
    return

def helper_thread():
    while True:
        update_cache()
        logging.debug("helper thread updated cache with predictions")
        time.sleep(60*10)

@app.get('/predictions')
async def predictions():
    return cache

if __name__ == 'app':
    helper = threading.Thread(target=helper_thread, daemon=True)
    helper.start()

if __name__ == '__main__':
    logging.info(f"running on {args.host}, listening on port {args.port}")
    uvicorn.run("app:app", host=args.host, port=args.port, reload=True)