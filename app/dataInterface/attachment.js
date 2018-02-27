'use strict';

const joi = require('joi');

exports = module.exports = {};

let getAttachmentByAttachmentId = {
  query: {
    aid: joi.number().required(),
  },
};

let getAttachmentByMemberId = {
};

let uploadFile = {

};

exports.getAttachmentByMemberId = getAttachmentByMemberId;
exports.getAttachmentByAttachmentId = getAttachmentByAttachmentId;
exports.uploadFile = uploadFile;
