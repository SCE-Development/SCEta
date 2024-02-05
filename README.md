# How to Run SCEta

## Backend Only
1. Request 511 api key from https://511.org/open-data/token

2. Create `data.yaml` file in the `server` folder of this project

  ```yml
  api_key: <YOUR API KEY from #1>
  stops:
    - operator: SC
      name: 10th & Taylor
      id: 64995
    - operator: BA
      name: Milpitas
      id: MLPT
  grouped_stops:
    - operator: CT
      group_name: San Jose Diridon Caltrain Station
      ids:
        - 70261
        - 70262
  cache_update_interval_minutes: 10
  ```

3. Create virutal env

   ```sh
   python -m venv sce-venv
   ```

4. Activate virtual env

   - Window:

   ```sh
   .\sce-venv\modules\Scripts\activate.bat
   ```

   - MacOS/Linux

   ```sh
   source sce-venv/bin/activate
   ```

5. Run script in the project's root directory

- Command line:

  ```sh
  python ./server/app.py --host=0.0.0.0 --port=8001 --config=./server/data.yaml
  ```

- Docker:

  ```sh
  docker-compose up --build
  ```

6. Access transit predictions at http://localhost:8001/predictions

## Frontend and Backend

Make sure you have Docker installed on your device
1. Follow steps 1 + 2 for running the "Backend Only"

2. In the project's root directory, paste the following script in the terminal:
  ```sh
  docker-compose -f docker-compose.dev.yml up
  ```

3. Now, you can access SCEta's frontend and backend data from `localhost:3001`
- To view the frontend, go to `localhost:3001`
- To view transit predictions from the server, go to `localhost:3001/api/predictions`
- To view metrics, go to `localhost:3001/prometheus/graph`
