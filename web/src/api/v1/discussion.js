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
    .then(response => {
      const data = response.data;
      if (data.posts.length >= 1 && typeof data.posts[0].index === 'undefined') {
        data.posts.forEach((post, idx) => {
          post.index = ((param.page || 1) - 1) * config.api.pagesize + idx + 1;
        });
      }
      resolve(data);
    })
    .catch(error => reject(error));
  });
}

function fetchDiscussionPostByIdAndIndex (param) {
  if (!param.id) return Promise.reject('require id for discussion.');
  else if (!param.index) return Promise.reject('require index for post.');

  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${param.id}/post/${param.index}${param.raw ? '?raw=on' : ''}`)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

function updateDiscussionPostByIdAndIndex (param) {
  if (!param.id) return Promise.reject('require id for discussion.');
  else if (!param.index) return Promise.reject('require index for post.');

  return new Promise((resolve, reject) => {
    const payload = {
      content: param.content,
      encoding: param.encoding,
    };
    if (param.replyTo) {
      payload.replyTo = param.replyTo;
    }
    axios.put(`${config.api.url}/${config.api.version}/discussion/${param.id}/post/${param.index}`, payload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function createDiscussion (param) {
  if (!param.discussion) return Promise.reject('require discussion');
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/discussions`, param.discussion)
    .then(response => resolve(response.data))
    .catch(error => reject(error));
  });
}

function replyToDiscussion (param) {
  if (!param.id) return Promise.reject('discussion id is required.');
  return new Promise((resolve, reject) => {
    const payload = {
      content: param.content,
      encoding: param.encoding,
    };
    if (param.replyTo) {
      payload.replyTo = param.replyTo;
    }
    axios.post(`${config.api.url}/${config.api.version}/discussion/${param.id}/post`, payload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

function banPostByDiscussionIdAndIndex (param) {
  if (!param.id) return Promise.reject('discussion id is required');
  if (!param.index) return Promise.reject('post index is required');
  return new Promise((resolve, reject) => {
    axios.delete(`${config.api.url}/${config.api.version}/discussion/${param.id}/post/${param.index}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

export default {
  fetchLatestDiscussions,
  fetchDiscussionMetaById,
  fetchDiscussionPostsById,
  fetchDiscussionPostByIdAndIndex,
  updateDiscussionPostByIdAndIndex,
  createDiscussion,
  replyToDiscussion,
  banPostByDiscussionIdAndIndex,
};
