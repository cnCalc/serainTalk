import axios from 'axios';
import config from '../../config.js';
import object2query from '../../utils/object2query';

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
 * @param {number} params.pagesize Size of the page
 *
 * @returns {Promise} Promise of the request
 */
function fetchDiscussionsUnderCategory (params) {
  if (!params.slug) return Promise.reject('require slug for discussion.');

  const query = {};

  if (params.tag) {
    query.tag = params.tag;
  }
  if (params.sortBy) {
    query.sortBy = params.sortBy;
  }

  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/category/${params.slug}/discussions?page=${params.page || 1}&pagesize=${params.pagesize || config.pagesize}&${ object2query(query) }`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  fetchCategoryList,
  fetchDiscussionsUnderCategory,
};
