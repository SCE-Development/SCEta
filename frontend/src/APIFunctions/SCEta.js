import axios from 'axios';
import { ApiResponse } from './ApiResponses.js';

let SCETA_API_URL = 'http://localhost:8001/predictions';

export async function getTransitPredictions() {
  let status = new ApiResponse();
  await axios
    .get(SCETA_API_URL)
    .then(res => {
      status.responseData = res.data;
    })
    .catch(err => {
      status.responseData = err;
      status.error = true;
    });
  return status;
}
