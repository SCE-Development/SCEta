# How to Run

1. Request 511 api key from https://511.org/open-data/token
2. Create virutal env

   ```sh
   python -m venv sce-venv
   ```

3. Activate virtual env

   - Window:

   ```sh
   .\sce-venv\modules\Scripts\activate.bat
   ```

   - MacOS/Linux

   ```sh
   source sce-venv/bin/activate
   ```

4. create a config.yml file

   ```yml
   api_key: <YOUR API KEY from #1>
   stops:
     - operator: SC
       id: 46573
     - operator: SC
       id: 46521
   cache_update_interval_minutes: 5
   ```

5. Run script

- Command line:

  ```sh
  python app.py --host=0.0.0.0 --port=5000
  ```

- Docker:

  ```sh
  docker-compose up --build
  ```

6. Access transit predictions at http://localhost:8000/predictions
