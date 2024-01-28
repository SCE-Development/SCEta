# How to Run

1. Request 511 api key from https://511.org/open-data/token

2. Create `data.yaml` file in the same folder as this project

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

5. Run script

- Command line:

  ```sh
  python app.py --host=0.0.0.0 --port=8001 --config=data.yaml
  ```

- Docker:

  ```sh
  docker-compose up --build
  ```

6. Access transit predictions at http://localhost:8001/predictions