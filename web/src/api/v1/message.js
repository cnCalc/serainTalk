import axios from 'axios';
import config from '../../config.js';

function fetchMessageSessions (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/message`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchMessageSessionById (param) {
  let querys = [];

  if (param.before) {
    querys.push(`beforeDate=${param.before}`);
  }

  if (param.after) {
    querys.push(`afterDate=${param.after}`);
  }

  let queryString = querys.length > 0 ? ('?' + querys.join('&')) : '';

  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/message/${param.id}${queryString}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function sendNewMessage (param) {
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/message/${param.id}`, { content: param.content })
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  fetchMessageSessions,
  fetchMessageSessionById,
  sendNewMessage,
};
