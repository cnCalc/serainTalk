'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sendNotification = {
  params: {
    id: interfaceUtils.mongoId
  },
  body: {
    content: joi.string().required(),
    href: joi.string(),
  }
};
exports.sendNotification = sendNotification;

let getNotification = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
    after: joi.number().default(0)
  }
};
exports.getNotification = getNotification;
