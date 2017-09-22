'use strict';

const joi = require('joi');
const config = require('../config');
const utils = require('./utils');

exports = module.exports = {};

let getLatestDiscussionList = {
  member: {
    role: joi.string().valid(['admin', 'member']),
  },
  query: {
    tag: joi.array().items(joi.string().valid(config.discussion.category.whiteList)),
    memberid: utils.mongoId,
    pagesize: utils.pagesize,
    offset: utils.offset
  }
};
exports.getLatestDiscussionList = getLatestDiscussionList;

