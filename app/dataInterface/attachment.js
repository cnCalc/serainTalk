'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let getAttachmentByAttachmentId = {
  query: joi.object({
    aid: joi.number(),
    id: interfaceUtils.mongoId,
  }).or('aid', 'id'),
};

let getAttachmentsByMemberId = {
};

let uploadFile = {

};

exports.getAttachmentByAttachmentId = getAttachmentByAttachmentId;
exports.getAttachmentsByMemberId = getAttachmentsByMemberId;
exports.uploadFile = uploadFile;
