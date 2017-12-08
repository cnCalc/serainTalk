'use strict';

const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const config = require('../../config');

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
  return next();
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
  return next();
};
exports.prepareData = prepareData;
