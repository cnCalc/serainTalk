'use strict';

const env = require('../../utils/env');

exports = module.exports = {};

let setRelease = async (next) => {
  let isRelease = env.isRelease;
  env.isRelease = true;

  try {
    await next();
  } catch (err) {
    throw err;
  } finally {
    env.isRelease = isRelease;
  }
};
exports.setRelease = setRelease;
