'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

let getDiscussionsUnderSpecifiedCategory = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page
  },
  params: {
    slug: joi.string().required()
  }
};
exports.getDiscussionsUnderSpecifiedCategory = getDiscussionsUnderSpecifiedCategory;

let getCategoryList = {};
exports.getCategoryList = getCategoryList;
