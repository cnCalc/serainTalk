import axios from 'axios';
import config from '../../config.js';

function fetchCategoryList (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/category`)
    .then(response => resolve(response.data.groups))
    .catch(error => reject(error));
  });
}

function fetchDiscussionsUnderCategory (params) {
  if (!params.slug) return Promise.reject('require slug for discussion.');
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/category/${params.slug}/discussions?page=${params.page || 1}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

export default {
  fetchCategoryList,
  fetchDiscussionsUnderCategory
};
