import axios from 'axios';
import config from '../../config.js';

/**
 * Get the new ID of resource by it's original Discuz ID (tid, pid, etc)
 *
 * @param {object} params An object containing the parameters
 *
 * @returns {Promise} Promise of the request
 */
function discuzLookup (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discuz-lookup?${Object.keys(params).map(k => `${k}=${params[k]}`).join('&')}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  discuzLookup,
};
