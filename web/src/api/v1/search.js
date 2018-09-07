import axios from 'axios';
import config from '../../config.js';

function searchDiscussionTitle (params = {}) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/search/discussion?keywords=${params.keywords}`)
      .then(response => {
        delete response.data.status;
        resolve(response.data);
      })
      .catch(error => reject(error));
  });
}

function searchMember (params = {}) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/search/member?keywords=${params.keywords}`)
      .then(response => {
        delete response.data.status;
        resolve(response.data);
      })
      .catch(error => reject(error));
  });
}

export default {
  searchDiscussionTitle,
  searchMember,
};
