'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sudo = {
  query: {
    id: interfaceUtils.mongoId,
  },
};
exports.sudo = sudo;

let sendNotification = {
  params: {
    id: interfaceUtils.mongoId,
  },
  query: {
    content: joi.string().required(),
    href: joi.string(),
  },
};
exports.sendNotification = sendNotification;

let isAdmin = {};
exports.isAdmin = isAdmin;
