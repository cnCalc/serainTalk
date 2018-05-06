'use strict';

const joi = require('joi');
const config = require('../../config');

exports = module.exports = {};

let mongoId = joi.string().hex().length(24);
exports.mongoId = mongoId;

let pagesize = joi.number().default(config.pagesize);
exports.pagesize = pagesize;

let page = joi.number().default(1);
exports.page = page;

let flag = joi.boolean().truthy('on').falsy('off');
exports.flag = flag;
