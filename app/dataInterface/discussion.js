'use strict';

const joi = require('joi');
const config = require('../../config/staticConfig');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let getLatestList = {
  query: joi.object({
    tag: joi.alternatives(joi.array().items(joi.string()), joi.string()),
    category: joi.array().items(joi.string()),
    sticky: joi.array().items(joi.string().valid('category')).min(1),
    memberId: interfaceUtils.mongoId,
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
    sortBy: joi.string().valid('createAt', 'replyAt').default('replyAt'),
  }),
};
exports.getLatestList = getLatestList;

let getDiscussionById = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.getDiscussionById = getDiscussionById;

let getDiscussionByMember = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
  query: joi.object({
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  }),
};
exports.getDiscussionByMember = getDiscussionByMember;

let getDiscussionsByCategory = {
  query: joi.object({
    tag: joi.alternatives(joi.array().items(joi.string()), joi.string()),
    sticky: joi.array().items(joi.string().valid('site')).min(1),
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
    sortBy: joi.string().valid('createAt', 'replyAt').default('replyAt'),
  }),
  params: joi.object({
    slug: joi.string().required(),
  }),
};
exports.getDiscussionsByCategory = getDiscussionsByCategory;

let getPostsById = {
  query: joi.object({
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  }),
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.getPostsById = getPostsById;

let getPostByIndex = {
  query: joi.object({
    raw: interfaceUtils.flag,
  }),
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().required(),
  }),
};
exports.getPostByIndex = getPostByIndex;

let createDiscussion = {
  body: joi.object({
    attachments: joi.array().items(interfaceUtils.mongoId).default([]),
    title: joi.string().required(),
    tags: joi.array().items(joi.string()).required(),
    category: joi.string().required(),
    content: {
      encoding: joi.string().required(),
      content: joi.string().required(),
    },
  }),
};
exports.createDiscussion = createDiscussion;

let createPost = {
  body: joi.object({
    attachments: joi.array().items(interfaceUtils.mongoId).default([]),
    encoding: joi.string().required(),
    content: joi.string().required(),
    replyTo: {
      type: joi.string().allow('index').required(),
      value: joi.number().required(),
      memberId: interfaceUtils.mongoId.required(),
    },
  }),
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.createPost = createPost;

let votePost = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required(),
  }),
  body: joi.object({
    vote: joi.string().allow(...config.discussion.post.vote).required(),
  }),
};
exports.votePost = votePost;

let stickyDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
  body: joi.object({
    sticky: joi.string().valid('site', 'category').required(),
  }),
};
exports.stickyDiscussion = stickyDiscussion;

let updatePost = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1).required(),
  }),
  body: joi.object({
    attachments: joi.array().items(interfaceUtils.mongoId),
    encoding: joi.string(),
    content: joi.string(),
    replyTo: {
      type: joi.string().allow('index').required(),
      value: joi.number().required(),
      memberId: interfaceUtils.mongoId.required(),
    },
    meta: {
      title: joi.string(),
      category: joi.string(),
    },
  }),
};
exports.updatePost = updatePost;

let deletePost = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
    postIndex: joi.number().min(1),
  }),
  query: joi.object({
    force: interfaceUtils.flag,
  }),
};
exports.deletePost = deletePost;

let banDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
  query: joi.object({
    force: interfaceUtils.flag,
  }),
};
exports.banDiscussion = banDiscussion;

let lockDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.lockDiscussion = lockDiscussion;

let ignoreDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.ignoreDiscussion = ignoreDiscussion;

let watchDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.watchDiscussion = watchDiscussion;

let normalDiscussion = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.normalDiscussion = normalDiscussion;

let ignoreMember = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
};
exports.ignoreMember = ignoreMember;

let getDiscussionsWatchedByMember = {
  query: joi.object({
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
  }),
};
exports.getDiscussionsWatchedByMember = getDiscussionsWatchedByMember;
