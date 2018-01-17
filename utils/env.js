'use strict';

const isProd = process.env.NODE_ENV === 'production';
const isMocha = process.env.NODE_ENV === 'mocha';
const isDev = !(isProd || isMocha);

module.exports = {
  isProd, isMocha, isDev,
};
