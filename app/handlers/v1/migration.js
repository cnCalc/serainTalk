'use strict';

const config = require('../../../config');
const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages, md5: MD5 } = utils;

let migrateTokens = {};

/**
 * [处理函数] 验证 Discuz 用户的信息
 * post: /api/v1/migration/verify?name=<name>&password=<password>
 *
 * 验证其用户和密码
 * 若通过，则返回一个随机 token，用于完成下一步转换
 * @param {Request} req
 * @param {Response} res
 */
async function verifyDiscuzMemberInfo (req, res) {
  let { name, password, email } = req.body;

  try {
    let memberInfo = await dbTool.db.collection('common_member').findOne({ username: name });

    if (!memberInfo) {
      return utils.errorHandler(null, utils.errorMessages.NOT_FOUND, 404, res);
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
    // TODO: 将 token 保存至数据库中，防止服务器重启导致数据丢失
    let token = utils.createRandomString(6);
    while (migrateTokens[token]) {
      token = utils.createRandomString(6);
    }
    migrateTokens[token] = {
      name: name,
      timestamp: new Date().getTime(),
      email: email
    };

    // 将 token 发送至新的邮箱地址
    await utils.mail.sendVerificationCode(email, token);

    return res.send({
      status: 'ok',
    });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }
}

/**
 * [处理函数] 执行迁移
 * post: /api/v1/migration/perform
 *
 * 此时允许用户设置全新的用户名和密码，以及自己的 E-Mail
 * 当然用户名不能与其他用户重名
 * @param {Request} req
 * @param {Response} res
 */
async function performMigration (req, res) {
  let { token, name, password } = req.body;

  if (Date.now() - migrateTokens[token].timestamp > config.password.tokenValidTime) {
    return errorHandler(null, errorMessages.TIME_OUT, 400, res);
  }

  try {
    let memberInfo = await dbTool.commonMember.findOne({ username: name });

    if (memberInfo) {
      return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
    }

    // 加密密码，采用和新的密码杂凑方式
    let salt = utils.createRandomString();
    let newMemberInfo = {
      username: name,
      email: migrateTokens[token].email,
      credentials: {
        type: 'seraintalk',
        salt,
        password: MD5(salt + req.body.password),
      }
    };

    await dbTool.commonMember.findAndModify(
      { username: migrateTokens[token].name },
      [],
      { $set: newMemberInfo }
    );

    delete migrateTokens[token];
    return res.send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }
}

// router.post('/verify', verifyDiscuzMemberInfo);
// router.post('/perform', performMigration);

module.exports = {
  verifyDiscuzMemberInfo,
  performMigration
};
