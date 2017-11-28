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

let getMessage = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  }
};
exports.getMessage = getMessage;
