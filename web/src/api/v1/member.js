import axios from 'axios';
import config from '../../config.js';

/**
 * Get one member's info and recent activity by it's memberId
 *
 * @param {object} params An object containing the parameters
 * @param {ObjectId} params.id Member ID
 *
 * @returns {Promise} Promise of the request
 */
function fetchMemberInfoById (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${params.id}?recent=on`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Get one member's info by it's username
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.name Username
 *
 * @returns {Promise} Promise of the request
 */
function fetchMemberInfoByName (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/members?name=${params.name}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Get more recent activities before some date.
 *
 * @param {object} params An object containing the parameters
 * @param {ObjectId} params.id Member ID
 * @param {number} params.before JavaScript timestamp of the begining date
 *
 * @returns {Promise} Promise of the request
 */
function fetchMoreMemberRecentActivityById (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${params.id}?recent=on&before=${params.before}`)
      .then(response => resolve({
        recentActivities: response.data.member.recentActivities,
        members: response.data.members,
      }))
      .catch(error => reject(error));
  });
}

/**
 * Get discussions which is created by the member.
 *
 * @param {object} params An object containing the parameters
 * @param {ObjectId} params.id Member ID
 * @param {number} params.page
 *
 * @returns {Promise} Promise of the request
 */
function fetchDiscussionsCreatedByMember (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${params.id}/discussions?page=${params.page || 1}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Sign in the forum.
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.name Member name
 * @param {string} params.password Password
 *
 * @returns {Promise} Promise of the request
 */
function signin (params) {
  const credentials = {
    name: params.name,
    password: params.password,
  };

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/member/login`, credentials)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Sign out.
 *
 * @param {object} params An object containing the parameters
 *
 * @returns {Promise} Promise of the request
 */
function signout (params) {
  return new Promise((resolve, reject) => {
    axios.delete(`${config.api.url}/${config.api.version}/member/login`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Get current member's info.
 *
 * @param {object} params An object containing the parameters
 *
 * @returns {Promise} Promise of the request
 */
function fetchMe (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/me`)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

/**
 * Get member list whose name is begining with the string.
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.leadingString Leading string.
 *
 * @returns {Promise} Promise of the request
 */
function fetchMemberWithLeadingString (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/members/startwith/${params.leadingString}`)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

/**
 * Upload and setup a new avatar
 *
 * @param {object} params An object containing the parameters
 * @param {File} params.file File object to upload.
 * @param {number} params.x Top coordinate to cut.
 * @param {number} params.y Left coordinate to cut.
 * @param {number} params.w Width to cut.
 * @param {number} params.h Height to cut.
 * @param {object} cfg Request configuration
 *
 * @returns {Promise} Promise of the request
 */
function uploadAvatar (params, cfg) {
  let fd = new window.FormData();
  fd.append('avatar', params.file);

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/member/avatar?left=${params.x}&top=${params.y}&width=${params.w}&height=${params.w}`, fd, cfg)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

/**
 * Update member's bio and other info.
 *
 * @param {object} params An object containing the parameters
 * @param {string} bio New bio
 *
 * @returns {Promise} Promise of the request
 */
function updateMemberInfo (params) {
  let payload = {};

  if (typeof params.bio === 'string') payload.bio = params.bio;

  return new Promise((resolve, reject) => {
    axios.put(`${config.api.url}/${config.api.version}/member`, payload)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

/**
 * Update member's password
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.password New password.
 *
 * @returns {Promise} Promise of the request
 */
function resetPassword (params) {
  let payload = {};

  if (params.password) {
    payload.password = params.password;
  }

  return new Promise((resolve, reject) => {
    axios.put(`${config.api.url}/${config.api.version}/member/password`, payload)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

/**
 * Update member's settings
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.key Key of the settings.
 * @param {string} params.value Value of the settings.
 *
 * @returns {Promise} Promise of the request
 */
function updateSetting (params) {
  return new Promise((resolve, reject) => {
    axios.put(`/api/v1/member/settings/${params.key}`, { value: params.value })
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

export default {
  fetchMemberInfoById,
  fetchMemberInfoByName,
  fetchMoreMemberRecentActivityById,
  fetchDiscussionsCreatedByMember,
  signin, signout,
  fetchMe,
  fetchMemberWithLeadingString,
  uploadAvatar,
  updateMemberInfo,
  resetPassword,
  updateSetting,
};
