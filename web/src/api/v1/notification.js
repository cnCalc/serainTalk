import axios from 'axios';
import config from '../../config.js';

function fetchNotification (param = {}) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/notification`)
      .then(response => {
        delete response.data.status;
        resolve(response.data);
      })
      .catch(error => reject(error));
  });
}

function readNotification (param = {}) {
  if (!param.index) return Promise.reject('index is required');

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/notification/${param.index}/read`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function readAllNotifications (param = {}) {
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/notification/all/read`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  fetchNotification,
  readNotification,
  readAllNotifications,
};
