'use strict';

const utils = require('../../utils');
const { errorHandler, errorMessages } = utils;

exports = module.exports = {};

let checkEnv = (req, res, next) => {
  if (process.env.NODE_ENV === 'DEV') return next();
  return errorHandler(null, errorMessages.WRONG_ENV, 410, res);
};
exports.checkEnv = checkEnv;
