'use strict';

const jwt = require('jsonwebtoken');
const config = require('./../config');
const errorHandler = require('./error-handler');
const errorMessages = require('./error-messages');

/**
 * [中间件]获取用户信息
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let getUserInfo = (req, res, next) => {
  if (req.cookies && req.cookies.usertoken) {
    try {
      req.user = jwt.verify(req.cookies.usertoken, config.jwtSecret);
    } catch (err) {
      errorHandler(err, errorMessages.BAD_COOKIE, 400, res);
      return;
    }
  }
  next();
};

/**
 * [中间件]整理参数
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let sortData = (req, res, next) => {
  req.data = Object.assign({}, req.params, req.body, req.query);
  next();
};

/**
 * 构建 RESTful 的 url
 *
 * @param {string} url 基础链接
 * @param {object} params 参数
 */
let createRESTfulUrl = (url, params) => {
  url += '?';
  Object.keys(params).forEach(key => {
    url += `${key}=${params[key]}&`;
  });
  url = url.slice(0, -1);
  url = encodeURI(url);
  return url;
};

module.exports = {
  getUserInfo,
  sortData,
  createRESTfulUrl
};
