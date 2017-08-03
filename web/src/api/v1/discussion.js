import axios from 'axios';
import config from '../../config.js';

function fetchLatestDiscussions (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/latest?page=${param.page || 1}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

function fetchDiscussionMetaById (param) {
  if (!param.id) return Promise.reject('require id for discussion.');
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${param.id}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

function fetchDiscussionPostsById (param) {
  if (!param.id) return Promise.reject('require id for discussion.');
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${param.id}/posts?page=${param.page || 1}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

export default {
  fetchLatestDiscussions,
  fetchDiscussionMetaById,
  fetchDiscussionPostsById,
};