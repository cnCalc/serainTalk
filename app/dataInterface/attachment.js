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

let getAttachmentById = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};

let uploadFile = {

};

let deleteFile = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};

exports.getAttachmentByAttachmentId = getAttachmentByAttachmentId;
exports.getAttachmentsByMemberId = getAttachmentsByMemberId;
exports.getAttachmentById = getAttachmentById;
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
