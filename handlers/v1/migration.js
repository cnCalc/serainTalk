'use strict';

const express = require('express');
const dbTool = require('../../utils/database');
const utils = require('../../utils');
const config = require('../../config');
const MD5 = utils.md5;

let router = express.Router();

let migrateTokens = {};

/**
 * [处理函数] 验证 Discuz 用户的信息
 * get: /api/v1/migration/verify?name=<name>&password=<password>
 *
 * 验证其用户和密码
 * 若通过，则返回一个随机 token，用于完成下一步转换
 * @param {Request} req
 * @param {Response} res
 */
async function verifyDiscuzMemberInfo (req, res) {
  let memberInfo = {};
  let { name, password } = req.data;

  try {
    utils.datacheck.checkUndefined({ name, password });
  } catch (err) {
    return utils.errorHandler(null, err.message, 400, res);
  }

  try {
    memberInfo = await dbTool.db.collection('common_member').findOne({ username: name });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  if (memberInfo.credentials.type !== 'discuz') {
    return utils.errorHandler(null, utils.errorMessages.ALREADY_MIGRATED, 400, res);
  }

  // 核对密码。
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
  while (!migrateTokens[token]) {
    token = utils.createRandomString(20);
  }
  migrateTokens[token] = {
    name: name,
    timestamp: new Date().getTime(),
  };

  return res.send({
    status: 'ok',
    token,
  });
}

/**
 * [处理函数] 执行迁移
 * get: /api/v1/migration/perform
 *
 * 此时允许用户设置全新的用户名和密码，以及自己的 E-Mail
 * 当然用户名不能与其他用户重名
 * @param {Request} req
 * @param {Response} res
 */
async function performMingration (req, res) {
  let memberInfo = {};
  let token = req.data;

  try {
    utils.datacheck.checkUndefined({ token: migrateTokens[token] });
    if (Date.now() - migrateTokens[token].timestamp > config.tokenValidTime) {
      throw new Error(utils.errorMessages.TIME_OUT);
    }
  } catch (err) {
    return utils.errorHandler(null, err.message, 400, res);
  }

  try {
    memberInfo = await dbTool.db.collection('common_member').findOne({ username: req.data.name });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  if (memberInfo) {
    return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
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
      { username: migrateTokens[token].name },
      [],
      { $set: newMemberInfo }
    );
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  delete migrateTokens[token];
  return res.send({ status: 'ok' });
}

router.get('/verify', verifyDiscuzMemberInfo);
router.get('/perform', performMingration);

module.exports = router;
