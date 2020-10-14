'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let sudo = {
  query: joi.object({
    id: interfaceUtils.mongoId,
  }),
};
exports.sudo = sudo;

let sendNotification = {
  params: joi.object({
    id: interfaceUtils.mongoId,
  }),
  query: joi.object({
    content: joi.string().required(),
    href: joi.string(),
  }),
};
exports.sendNotification = sendNotification;

let inviteCode = {};
exports.inviteCode = inviteCode;

let isAdmin = {};
exports.isAdmin = isAdmin;
