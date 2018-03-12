'use strict';

const joi = require('joi');

exports = module.exports = {};

let getAttachmentByAttachmentId = {
  query: {
    aid: joi.number().required(),
  },
};

let getAttachmentsByMemberId = {
};

let uploadFile = {

};

exports.getAttachmentsByMemberId = getAttachmentsByMemberId;
exports.getAttachmentByAttachmentId = getAttachmentByAttachmentId;
exports.uploadFile = uploadFile;
