'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sendMessage = {
  params: {
    id: interfaceUtils.mongoId
  },
  body: {
    content: joi.string().required()
  }
};
exports.sendMessage = sendMessage;

let getMessagesInfo = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  }
};
exports.getMessagesInfo = getMessagesInfo;

let getMessageByMemberId = {
  params: {
    id: interfaceUtils.mongoId.required()
  },
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  }
};
exports.getMessageByMemberId = getMessageByMemberId;

let getMessageById = {
  params: {
    id: interfaceUtils.mongoId.required()
  },
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  }
};
exports.getMessageById = getMessageById;
