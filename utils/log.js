'use strict';

function middleware(req, res, next) {
  console.log(`[${new Date().toLocaleString()}] ${req.headers['x-real-ip'] || req.ip} - ${req.method} ${req.url} - ${req.headers['user-agent']}`);
  next();
}

module.exports = middleware;