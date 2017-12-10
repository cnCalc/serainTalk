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
    page: interfaceUtils.page
  }
};
exports.getLatestList = getLatestList;

let getDiscussionById = {
  params: {
    id: interfaceUtils.mongoId.required()
  }
};
exports.getDiscussionById = getDiscussionById;

let getDiscussionByMember = {
  params: {
    id: interfaceUtils.mongoId.required()
  },
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  }
};
exports.getDiscussionByMember = getDiscussionByMember;

let getDiscussionsByCategory = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  },
  params: {
    slug: joi.string().required()
  }
};
exports.getDiscussionsByCategory = getDiscussionsByCategory;

let getPostsById = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  },
  params: {
    id: interfaceUtils.mongoId.required()
  }
};
exports.getPostsById = getPostsById;

let createDiscussion = {
  body: {
    title: joi.string().required(),
    tags: joi.array().items(joi.string()).required(),
    category: joi.string().required(),
    content: {
      encoding: joi.string().required(),
      content: joi.string().required()
    }
  }
};
exports.createDiscussion = createDiscussion;

let createPost = {
  body: {
    encoding: joi.string().required(),
    content: joi.string().required(),
    replyTo: {
      type: joi.string().allow(['index']).required(),
      value: joi.number().required(),
      memberId: interfaceUtils.mongoId.required()
    }
  },
  params: {
    id: interfaceUtils.mongoId.required()
  }
};
exports.createPost = createPost;

let votePost = {
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required()
  },
  body: {
    vote: joi.string().allow([config.discussion.post.vote]).required()
  }
};
exports.votePost = votePost;

let updatePost = {
  params: {
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required()
  },
  body: {
    encoding: joi.string(),
    content: joi.string().required(),
  }
};
exports.updatePost = updatePost;
