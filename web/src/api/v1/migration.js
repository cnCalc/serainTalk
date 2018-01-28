import axios from 'axios';
import config from '../../config.js';

function requestMigration (param) {
  const requestPayload = {
    name: param.name,
    password: param.password,
    email: param.email,
    code: param.code,
  };

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/migration/verify`, requestPayload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function performMigration (param) {
  const requestPayload = {
    token: param.token,
    name: param.name,
    newname: param.newname,
    newpassword: param.password,
  };

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/migration/perform`, requestPayload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  requestMigration,
  performMigration,
};
