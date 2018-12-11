import axios from 'axios';
import config from '../../config.js';

/**
 * Get latest discussions from server
 *
 * @param {object} params An object containing the parameters
 * @param {number} params.page Page of the request.
 *
 * @returns {Promise} Promise of the request
 */
function fetchLatestDiscussions (params) {
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/latest?page=${params.page || 1}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Fetch the metadata of one discussion by it's id
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.id ID of the discussion
 *
 * @returns {Promise} Promise of the request
 */
function fetchDiscussionMetaById (params) {
  if (!params.id) return Promise.reject('require id for discussion.');
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${params.id}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Get posts in the discussion by the discussion's id
 *
 * @param {object} params An object containing the parameters
 * @param {string} params.id ID of the discussion
 * @param {number} params.page Page of the request
 *
 * @returns {Promise} Promise of the request
 */
function fetchDiscussionPostsById (params) {
  if (!params.id) return Promise.reject('require id for discussion.');
  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${params.id}/posts?page=${params.page || 1}`)
      .then(response => {
        const data = response.data;
        if (data.posts.length >= 1 && typeof data.posts[0].index === 'undefined') {
          data.posts.forEach((post, idx) => {
            post.index = ((params.page || 1) - 1) * config.api.pagesize + idx + 1;
          });
        }
        resolve(data);
      })
      .catch(error => reject(error));
  });
}

/**
 * Get a single post in the discussion by the discussion's id and the post's index
 *
 * @param {Object} params An object containing the parameters
 * @param {string} params.id ID of the discussion
 * @param {number} params.index Index of the post
 * @param {bool} params.raw Render the post or not
 *
 * @returns {Promise} Promise of the request
 */
function fetchDiscussionPostByIdAndIndex (params) {
  if (!params.id) return Promise.reject('require id for discussion.');
  else if (!params.index) return Promise.reject('require index for post.');

  return new Promise((resolve, reject) => {
    axios.get(`${config.api.url}/${config.api.version}/discussions/${params.id}/post/${params.index}${params.raw ? '?raw=on' : ''}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Update a single post in the discussion by the discussion's id and the post's index
 *
 * @param {Object} params An object containing the parameters
 * @param {string} params.id ID of the discussion
 * @param {number} params.index Index of the post
 * @param {string} params.content Content of the new post
 * @param {string} params.encoding Encoding of the new post
 * @param {array.<string>} params.attachments Attachments used in the post
 *
 * @returns {Promise} Promise of the request
 */
function updateDiscussionPostByIdAndIndex (params) {
  if (!params.id) return Promise.reject('require id for discussion.');
  else if (!params.index) return Promise.reject('require index for post.');

  return new Promise((resolve, reject) => {
    const payload = {
      content: params.content,
      encoding: params.encoding,
    };
    if (params.replyTo) {
      payload.replyTo = params.replyTo;
    }
    if (params.meta) {
      payload.meta = params.meta;
    }
    if (params.attachments) {
      payload.attachments = params.attachments;
    }
    axios.put(`${config.api.url}/${config.api.version}/discussion/${params.id}/post/${params.index}`, payload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Create an new discussion
 *
 * @param {Object} params An object containing the parameters
 * @param {Object} params.discussion An object describing the new discussion.
 * @param {string} params.discussion.title Title of the new discussion
 * @param {string} params.discussion.category Category of the new discussion
 * @param {Object} params.discussion.content An object describing the content.
 * @param {string} params.discussion.content.content Content of the new discussion
 * @param {string} params.discussion.content.encoding Encoding of the content
 * @param {Array.<string>} params.discussion.tags Array of tags
 *
 * @returns {Promise} Promise of the request
 */
function createDiscussion (params) {
  if (!params.discussion) return Promise.reject('require discussion');
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/discussions`, params.discussion)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Create an new post as a reply to a discussion
 *
 * @param {Object} params An object containing the parameters
 * @param {string} params.id ID of the discussion
 * @param {string} params.conent Content of the new post
 * @param {string} params.encode Encoding of the new post
 * @param {Object} params.replyTo An object describing which post it is replying
 * @param {string} params.replyTo.type Type of the value
 * @param {string} params.replyTo.value Value of which post
 * @param {string} params.replyTo.memberId
 *
 * @returns {Promise}
 */
function replyToDiscussion (params) {
  if (!params.id) return Promise.reject('discussion id is required.');
  return new Promise((resolve, reject) => {
    const payload = {
      content: params.content,
      encoding: params.encoding,
    };
    if (params.replyTo) {
      payload.replyTo = params.replyTo;
    }
    if (params.attachments) {
      payload.attachments = params.attachments;
    }
    axios.post(`${config.api.url}/${config.api.version}/discussion/${params.id}/post`, payload)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Mark one post as deleted
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {number} param.index
 *
 * @returns {Promise}
 */
function deletePostByDiscussionIdAndIndex (params) {
  if (!params.id) return Promise.reject('discussion id is required');
  if (!params.index) return Promise.reject('post index is required');
  return new Promise((resolve, reject) => {
    axios.delete(`${config.api.url}/${config.api.version}/discussion/${params.id}/post/${params.index}`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Vote to one post
 *
 * @param {Object} params
 * @param {string} params.id
 * @param {number} params.index
 * @param {string} params.vote
 *
 * @returns {Promise}
 */
function votePostByDiscussionIdAndIndex (params) {
  if (!params.id) return Promise.reject('discussion id is required');
  if (!params.index) return Promise.reject('post index is required');
  if (!params.vote) return Promise.reject('vote type is required');
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/discussion/${params.id}/post/${params.index}/vote`, { vote: params.vote })
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Lock/unlock one discussion.
 *
 * @param {Object} params
 * @param {string} params.id
 *
 * @returns {Promise}
 */
function lockDiscussionById (params) {
  if (!params.id) return Promise.reject('discussion id is required');
  return new Promise((resolve, reject) => {
    axios.post(`${config.api.url}/${config.api.version}/discussion/${params.id}/lock`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Permanently delete one discussion.
 *
 * @param {Object} params
 * @param {string} params.id
 *
 * @returns {Promise}
 */
function deleteDiscussionPermanentlyById (params) {
  if (!params.id) return Promise.reject('discussion id is required');
  return new Promise((resolve, reject) => {
    axios.delete(`${config.api.url}/${config.api.version}/discussion/${params.id}?force=on`)
      .then(response => resolve(response.data))
      .catch(error => reject(error));
  });
}

/**
 * Update subscription mode
 *
 * @param {Object} params
 * @param {string} params.id ID of the discussion
 * @param {('normal'|'watch'|'ignore')} params.mode new subscription mode (normal, watch or ignore)
 *
 * @returns {Promise}
 */
function updateSubscribeModeById (params) {
  if (!params.id) return Promise.reject('discussion id is required');

  let URL = '';

  switch (params.mode) {
    case 'normal':
      URL = `${config.api.url}/${config.api.version}/discussion/${params.id}/normal`;
      break;
    case 'watch':
      URL = `${config.api.url}/${config.api.version}/discussion/${params.id}/watch`;
      break;
    case 'ignore':
      URL = `${config.api.url}/${config.api.version}/discussion/${params.id}/ignore`;
      break;
    default:
      return Promise.reject('subscription mode is required');
  }

  return new Promise((resolve, reject) => {
    axios.post(URL)
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
  lockDiscussionById,
  deletePostByDiscussionIdAndIndex,
  votePostByDiscussionIdAndIndex,
  deleteDiscussionPermanentlyById,
  updateSubscribeModeById,
};
