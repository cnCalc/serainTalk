import axios from 'axios';
import config from '../../config.js';

/**
 * Get all categories from server

 * @param {object} params An object containing the parameters

 * @returns {Promise} Promise of the request
 */
function fetchCategoryList (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/category`)
    .then(response => resolve(response.data.groups))
    .catch(error => reject(error));
  });
}

/**
 * Get posts by category slug.

 * @param {object} params An object containing the parameters
 * @param {string} params.slug Slug name of the category
 * @param {number} params.page Page of the request

 * @returns {Promise} Promise of the request
 */
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
  fetchDiscussionsUnderCategory,
};
