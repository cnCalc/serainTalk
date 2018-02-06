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
 * [中间件] 获取成员的权限
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let getPermissions = async (req, res, next) => {
  if (!req.member._id) req.member.role = 'anonymous';
  else if (!req.member.role) req.member.role = 'member';
  req.member.permissions = config.member.permissions[req.member.role];
  return next();
};
exports.getPermissions = getPermissions;
