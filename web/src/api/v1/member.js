import axios from 'axios';
import config from '../../config.js';

function fetchMemberInfoById (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${param.id}?recent=on`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchMemberInfoByName (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/members?name=${param.name}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchMoreMemberRecentActivityById (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${param.id}?recent=on&before=${param.before}`)
      .then(response => resolve({
        recentActivities: response.data.member.recentActivities,
        members: response.data.members,
      }))
      .catch(error => reject(error));
  });
}

function fetchDiscussionsCreatedByMember (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${param.id}/discussions?page=${param.page || 1}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function signin (param) {
  const credentials = {
    name: param.name,
    password: param.password,
  };

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/member/login`, credentials)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function signout (param) {
  return new Promise((resolve, reject) => {
    axios.delete(`${config.api.url}/${config.api.version}/member/login`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchMe (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/me`)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

function fetchMemberWithLeadingString (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/members/startwith/${param.leadingString}`)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

function uploadAvatar (param) {
  let fd = new window.FormData();
  fd.append('avatar', param.file);

  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/member/avatar?left=${param.x}&top=${param.y}&width=${param.w}&height=${param.w}`, fd)
      .then(response => resolve(response.data))
      .catch(reject);
  });
}

function updateMemberInfo (param) {
  let payload = {};

  if (typeof param.bio === 'string') payload.bio = param.bio;

  return new Promise((resolve, reject) => {
    axios.put(`${config.api.url}/${config.api.version}/member`, payload)
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
};
