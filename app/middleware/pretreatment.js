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
      const payload = jwt.verify(req.cookies.membertoken, config.jwtSecret);
      const memberDoc = await dbTool.commonMember.findOne({ _id: ObjectID(payload.id) });
      await memberUtils.removePrivateField(memberDoc, req.member.permissions);
      const memberId = memberDoc.id = memberDoc._id.toString();
      if (payload.sudo) memberDoc.role = 'admin';
      req.member = memberDoc;

      // 更新用户最后访问
      await dbTool.commonMember.updateOne(
        { _id: ObjectID(memberId) },
        { $set: { lastlogintime: Date.now() } }
      );
    } catch (err) {
      req.member = {};
      res.clearCookie('membertoken');
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
