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

let getDailyTraffic = {

};

let uploadFile = {

};

let deleteFile = {
  params: {
    id: interfaceUtils.mongoId.required(),
  },
};

exports.deleteFile = deleteFile;
exports.getAttachmentByAttachmentId = getAttachmentByAttachmentId;
exports.getAttachmentById = getAttachmentById;
exports.getAttachmentsByMemberId = getAttachmentsByMemberId;
exports.getDailyTraffic = getDailyTraffic;
exports.uploadFile = uploadFile;
