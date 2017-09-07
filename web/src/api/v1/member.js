import axios from 'axios';
import config from '../../config.js';

function fetchMemberInfoById (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}${config.api.version}/member/${param.id}?recent=on`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

function fetchDiscussionsCreatedByMember(param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}${config.api.version}/member/${param.id}/discussions?page=${param.page || 1}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  })
}

export default {
  fetchMemberInfoById,
  fetchDiscussionsCreatedByMember
};
