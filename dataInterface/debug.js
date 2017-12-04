'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sudo = {
  body: {
    id: interfaceUtils.mongoId
  }
};
exports.sudo = sudo;

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
