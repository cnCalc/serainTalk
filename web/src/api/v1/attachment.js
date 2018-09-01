import axios from 'axios';
import config from '../../config.js';

/**
 * Get all attachments uploaded by the current member
 *
 * @param {object} params An object containing the parameters
 *
 * @returns {Promise} Promise of the request
 */
function fetchMyAttachmentList (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/attachment/info/me`)
      .then(response => resolve(response.data.attachments))
      .catch(error => reject(error));
  });
}

/**
 * Upload new attachment.
 *
 * @param {object} params An object containing the parameters
 * @param {File} params.file File to upload
 * @param {Function} params.onUploadProgress Progress callback
 * @param {object} cfg Axios configuration
 *
 * @returns {Promise} Promise of the request
 */
function uploadAttachment (params, cfg) {
  let fd = new window.FormData();
  fd.append('file', params.file);

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/attachment`, fd, cfg)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Get remaining downlaod traffic.
 *
 * @param {Object} params An object containing the parameters
 *
 * @returns {Promise} Promise of the request
 */
function getRemainingTraffic (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/attachment/traffic`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  fetchMyAttachmentList,
  uploadAttachment,
  getRemainingTraffic,
};
