'use strict';

const express = require('express');
const dbTool = require('../../utils/database');
const utils = require('../../utils');
const MD5 = utils.md5;

let router = express.Router();

let migrateTokens = {};

/**
 * 验证 Discuz 用户的信息，验证其用户和密码
 * 若通过，则返回一个随机 token，用于完成下一步转换
 * @param {Request} req
 * @param {Response} res
 */
async function verifyDiscuzMemberInfo (req, res) {
  let memberInfo = {};

  if (!req.data.name || !req.data.password) {
    return utils.errorHandler(null, utils.errorMessages.LACK_INFO, 400, res);
  }

  try {
    memberInfo = await dbTool.db.collection('common_member').findOne({ username: req.data.name });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  if (memberInfo.credentials.type !== 'discuz') {
    return utils.errorHandler(null, utils.errorMessages.ALREADY_MIGRATED, 400, res);
  }

  // 核对密码。
  let password = req.data.password;
  if (memberInfo.credentials.salt === null) {
    password = MD5(MD5(password).toLowerCase());
    if (password !== memberInfo.credentials.password) {
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  } else {
    password = MD5(memberInfo.credentials.salt + password);
    if (password !== memberInfo.credentials.password) {
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  }

  // 保存迁移 token，留着下一步使用
  let token = utils.createRandomString(20);
  migrateTokens[token] = {
    name: req.data.name,
    timestamp: new Date().getTime(),
  };

  return res.send({
    status: 'ok',
    token,
  });
}

/**
 * 执行迁移，此时允许用户设置全新的用户名和密码，以及自己的 E-Mail
 * 当然用户名不能与其他用户重名
 * @param {Request} req
 * @param {Response} res
 */
async function performMingration (req, res) {
  let memberInfo = {};

  if (typeof migrateTokens[req.data.token] === 'undefined') {
    return utils.errorHandler(null, utils.errorMessages.BAD_REQUEST, 400, res);
  }

  try {
    memberInfo = await dbTool.db.collection('common_member').findOne({ username: req.data.name });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  if (memberInfo) {
    return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 500, res);
  }

  // 加密密码，采用和新的密码杂凑方式
  let salt = utils.createRandomString();
  let newMemberInfo = {
    username: req.data.name,
    email: req.data.email,
    credentials: {
      type: 'seraintalk',
      salt,
      password: MD5(salt + req.data.password),
    }
  };

  try {
    dbTool.db.collection('common_member').findAndModify(
      { username: migrateTokens[req.data.token].name },
      [],
      { $set: newMemberInfo }
    );
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  return res.send({ status: 'ok' });
}

router.get('/verify', verifyDiscuzMemberInfo);
router.get('/perform', performMingration);

module.exports = router;
