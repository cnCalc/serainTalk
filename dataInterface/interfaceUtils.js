'use strict';

const joi = require('joi');

exports = module.exports = {};

let mongoId = joi.string().hex().length(24);
exports.mongoId = mongoId;

let pagesize = joi.number().default(20);
exports.pagesize = pagesize;

let offset = joi.number().default(0);
exports.offset = offset;
