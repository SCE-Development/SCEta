# How to Run SCEta

- [ ] Request 511 api key from https://511.org/open-data/token

- [ ] setup sce-cli using the steps here https://github.com/SCE-Development/SCE-CLI
- [ ] clone the project with

```
sce clone transit
```

- [ ] link the project to the tool

```
cd PATH_TO_SCETA_HERE
sce link transit
```

- [ ] Create `data.yaml` file in the `server` folder of this project

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
    - name: San Jose Diridon Caltrain Station
      stops:
        - operator: CT
          id: 70261
        - operator: CT
          id: 70262
  cache_update_interval_minutes: 10
  ```

- [ ] run the project

```
sce run transit
```

- [ ] Access transit predictions at http://localhost:3001/api/predictions
- [ ] Now, you can access SCEta's frontend and backend data from http://localhost:3001
- [ ] To view metrics, go to http://localhost:3001/prometheus/graph
