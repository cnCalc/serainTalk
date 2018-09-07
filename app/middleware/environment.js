'use strict';

const utils = require('../../utils');
const { errorHandler, errorMessages } = utils;

exports = module.exports = {};

/* istanbul ignore next */
let checkEnv = (req, res, next) => {
  if (utils.env.isDev) return next();
  return errorHandler(null, errorMessages.WRONG_ENV, 410, res);
};
exports.checkEnv = checkEnv;
