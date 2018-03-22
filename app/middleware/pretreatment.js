'use strict';

const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const dbTool = require('../../database');
const memberUtils = require('../../utils/member');

exports = module.exports = {};

/**
 * [中间件]获取成员信息
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let getMemberInfo = async (req, res, next) => {
  req.member = {};
  if (req.cookies && req.cookies.membertoken) {
    try {
      let payload = jwt.verify(req.cookies.membertoken, config.jwtSecret);
      let memberDoc = await dbTool.commonMember.findOne({ _id: ObjectID(payload.id) });
      memberUtils.removePrivateField(memberDoc);
      memberDoc.id = memberDoc._id.toString();
      if (payload.sudo) memberDoc.role = 'admin';
      req.member = memberDoc;
    } catch (err) {
      req.member = {};
      res.clearCookie('membertoken');
    }
  }

  const currentDate = new Date().toDateString();

  if (!req.member.download || req.member.download.lastUpdate !== currentDate) {
    req.member.download = {
      lastUpdate: currentDate,
      traffic: 0,
    }
  }

  req.member.download.remainingTraffic = config.download.dailyTraffic - req.member.download.traffic;

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
