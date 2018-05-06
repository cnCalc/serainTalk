'use strict';

const joi = require('joi');
const config = require('../../config/staticConfig');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let getLatestList = {
  query: {
    tag: joi.array().items(joi.string()),
    category: joi.array().items(joi.string()),
    memberId: interfaceUtils.mongoId,
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  },
};
exports.getLatestList = getLatestList;

let getDiscussionById = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.getDiscussionById = getDiscussionById;

let getDiscussionByMember = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  },
};
exports.getDiscussionByMember = getDiscussionByMember;

let getDiscussionsByCategory = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  },
  params: {
    slug: joi.string().required(),
  },
};
exports.getDiscussionsByCategory = getDiscussionsByCategory;

let getPostsById = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  },
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.getPostsById = getPostsById;

let getPostByIndex = {
  query: {
    raw: interfaceUtils.flag,
  },
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().required(),
  },
};
exports.getPostByIndex = getPostByIndex;

let createDiscussion = {
  body: {
    attachments: joi.array().items(interfaceUtils.mongoId).default([]),
    title: joi.string().required(),
    tags: joi.array().items(joi.string()).required(),
    category: joi.string().required(),
    content: {
      encoding: joi.string().required(),
      content: joi.string().required(),
    },
  },
};
exports.createDiscussion = createDiscussion;

let createPost = {
  body: {
    attachments: joi.array().items(interfaceUtils.mongoId).default([]),
    encoding: joi.string().required(),
    content: joi.string().required(),
    replyTo: {
      type: joi.string().allow(['index']).required(),
      value: joi.number().required(),
      memberId: interfaceUtils.mongoId.required(),
    },
  },
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.createPost = createPost;

let votePost = {
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required(),
  },
  body: {
    vote: joi.string().allow([config.discussion.post.vote]).required(),
  },
};
exports.votePost = votePost;

let updatePost = {
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required(),
  },
  body: {
    attachments: joi.array().items(interfaceUtils.mongoId),
    encoding: joi.string(),
    content: joi.string(),
    replyTo: {
      type: joi.string().allow(['index']).required(),
      value: joi.number().required(),
      memberId: interfaceUtils.mongoId.required(),
    },
    meta: {
      title: joi.string(),
      category: joi.string(),
    },
  },
};
exports.updatePost = updatePost;

let deletePost = {
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1),
  },
  query: {
    force: interfaceUtils.flag,
  },
};
exports.deletePost = deletePost;

let banDiscussion = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
  query: {
    force: interfaceUtils.flag,
  },
};
exports.banDiscussion = banDiscussion;

let lockDiscussion = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.lockDiscussion = lockDiscussion;

let ignoreDiscussion = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.ignoreDiscussion = ignoreDiscussion;

let watchDiscussion = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.watchDiscussion = watchDiscussion;

let normalDiscussion = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.normalDiscussion = normalDiscussion;

let ignoreMember = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};
exports.ignoreMember = ignoreMember;
