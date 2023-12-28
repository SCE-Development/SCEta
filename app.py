from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dataclasses import dataclass
from args import get_args
import typing
import requests
import json
import uvicorn
import yaml
import threading
import time

args = get_args()
with open(args.config, "r") as stream:
    try:
        data = yaml.safe_load(stream)
        API_KEY = data.get("api_key", None)
        stops = data.get("stops", {})
    except yaml.YAMLError as exc:
        print(exc)

BASE_URL = 'https://api.511.org/transit'

app = FastAPI()

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

def update_cache():
    # clear cache of any previous (now outdated) data
    cache.clear()
    # send post request for each agency's stop(s)
    for stop in stops:
        agency = stop['operator']
        stopCode = stop['id']
        stopName= stop['name']

        params = {
            'api_key': API_KEY,
            'agency': agency,
            'stopCode': stopCode,
            'format': 'json'
        }

        response = requests.get(BASE_URL + '/StopMonitoring', params=params)

        if response.status_code == 200:
            content = response.content.decode('utf-8-sig')
            data = json.loads(content)

            all_incoming_buses = data['ServiceDelivery']['StopMonitoringDelivery']['MonitoredStopVisit']
            unique_buses = {}
            for bus in all_incoming_buses:
                line_ref = bus['MonitoredVehicleJourney']['LineRef']
                expected_arrival = bus['MonitoredVehicleJourney']['MonitoredCall']['AimedArrivalTime']
                
                if line_ref not in unique_buses:
                    unique_buses[line_ref] = []
                    
                unique_buses[line_ref].append(expected_arrival)

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

        else:
            return {'Error': 'Request failed'}, response.status_code
    return

def helper_thread():
    while True:
        update_cache()
        print("helper thread updated cache with predictions")
        time.sleep(60*10)

cache = []
helper = None
@app.get('/predictions')
async def predictions():
    return cache

if __name__ == 'app':
    helper = threading.Thread(target=helper_thread, daemon=True)
    helper.start()

if __name__ == '__main__':
    uvicorn.run("app:app", port=8000, reload=True)