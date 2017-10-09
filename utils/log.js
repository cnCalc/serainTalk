'use strict';

/**
 * [中间件]将访问的详细信息记录到日志，并输出到 stdout
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
function middleware (req, res, next) {
  console.log(`[${new Date().toLocaleString()}] ${req.headers['x-real-ip'] || req.ip} - ${req.method} ${req.url} - ${req.headers['user-agent']}`);
  next();
}

module.exports = middleware;
