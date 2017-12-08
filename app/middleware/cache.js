'use strict';

exports = module.exports = {};

/**
 * [中间件]对支持的浏览器禁用缓存
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let disableCache = (req, res, next) => {
  res.header('cache-control', 'no-cache');
  res.header('pragma', 'no-cache');
  res.header('expires', '0');
  return next();
};
exports.disableCache = disableCache;
