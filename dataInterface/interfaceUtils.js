'use strict';

const joi = require('joi');
const config = require('../config');

exports = module.exports = {};

let mongoId = joi.string().hex().length(24);
exports.mongoId = mongoId;

let pagesize = joi.number().default(config.pagesize);
exports.pagesize = pagesize;

let offset = joi.number().default(1);
exports.offset = offset;
