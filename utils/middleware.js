'use strict';

const jwt = require('jsonwebtoken');
const config = require('./../config');
const errorHandler = require('./error-handler');
const errorMessages = require('./error-messages');
const { ObjectID } = require('mongodb');

exports = module.exports = {};

/**
 * [中间件]获取成员信息
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let getMemberInfo = (req, res, next) => {
  req.member = {};
  if (req.cookies && req.cookies.membertoken) {
    try {
      req.member = jwt.verify(req.cookies.membertoken, config.jwtSecret);
      req.member.id = req.member._id;
      req.member._id = ObjectID(req.member.id);
    } catch (err) {
      req.member = {};
    }
  }
  next();
};
exports.getMemberInfo = getMemberInfo;
/**
 * [中间件]整理参数
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let prepareData = (req, res, next) => {
  req.data = Object.assign({}, req.params, req.body, req.query);
  next();
};
exports.prepareData = prepareData;

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
  next();
};
exports.disableCache = disableCache;

/**
 * [中间件] 验证成员是否为管理员身份
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let verifyAdmin = (req, res, next) => {
  if (req.member.role === 'admin') next();
  errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
};
exports.verifyAdmin = verifyAdmin;

/**
 * [中间件] 验证成员是否已登录
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let verifyMember = (req, res, next) => {
  if (req.member._id) next();
  errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
};
exports.verifyMember = verifyMember;
