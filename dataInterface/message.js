'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sendMessage = {
  params: {
    id: interfaceUtils.mongoId
  },
  body: {
    message: joi.string().required(),
    href: joi.string(),
  }
};
exports.sendMessage = sendMessage;
