import axios from 'axios';
import config from '../../config.js';

function fetchMemberInfoById (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${param.id}?recent=on`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function fetchMoreMemberRecentActivityById (param) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/member/${param.id}?recent=on&before=${param.before}`)
      .then(response => resolve(response.data.member.recentActivities))
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

export default {
  fetchMemberInfoById,
  fetchMoreMemberRecentActivityById,
  fetchDiscussionsCreatedByMember,
  signin, signout,
  fetchMe,
  fetchMemberWithLeadingString,
};
