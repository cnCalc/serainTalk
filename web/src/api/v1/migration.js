import axios from 'axios';
import config from '../../config.js';

function requestMigration (param) {
  const requestPayload = {
    name: param.name,
    password: param.password,
    email: param.email,
  };

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}${config.api.version}/migration/verify`, requestPayload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  requestMigration
};
