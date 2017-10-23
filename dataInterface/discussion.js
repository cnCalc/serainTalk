'use strict';

const joi = require('joi');
const config = require('../config');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let getLatestList = {
  query: {
    tag: joi.array().items(joi.string().valid(config.discussion.category.whiteList)),
    memberid: interfaceUtils.mongoId,
    pagesize: interfaceUtils.pagesize,
    offset: interfaceUtils.offset
  }
};
exports.getLatestList = getLatestList;

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
    content: joi.string().required()
  },
  params: {
    id: interfaceUtils.mongoId.required()
  }
};
exports.createPost = createPost;
