'use strict';

const joi = require('joi');

exports = module.exports = {};

let getAttachment = {
  query: {
    aid: joi.number().required()
  }
};
exports.getAttachment = getAttachment;
