'use strict';

const isProd = process.env.NODE_ENV === 'production';
const isMocha = process.env.NODE_ENV === 'mocha';
const isDev = !(isProd || isMocha);
const isRelease = process.env.RELEASE === 'stable';

module.exports = {
  isProd,
  isMocha,
  isDev,
  isRelease,
};
