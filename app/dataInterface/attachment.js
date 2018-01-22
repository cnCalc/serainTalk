'use strict';

const joi = require('joi');

exports = module.exports = {};

let getAttachment = {
  query: {
    aid: joi.number().required(),
  },
};

let uploadFile = {

};

exports.getAttachment = getAttachment;
exports.uploadFile = uploadFile;
