import axios from 'axios';
import { ApiResponse } from './ApiResponses.js';

export async function getTransitPredictions() {
  const scetaUrl = new URL('api/predictions', window.location.href)
  let status = new ApiResponse();
  await axios
    .get(scetaUrl.href)
    .then(res => {
      status.responseData = res.data;
    })
    .catch(err => {
      status.responseData = err;
      status.error = true;
    });
  return status;
}
