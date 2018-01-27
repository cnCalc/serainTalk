'use strict';

const _ = require('lodash');
const config = require('../../../config');
const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages, md5: MD5 } = utils;

/**
 * 迁移逻辑：
 *
 * 页面逻辑
 * - 显示 name输入框、发送邮件按钮、重新绑定邮箱按钮
 * - 点击 重新绑定邮箱按钮 则显示 email输入框 和 password输入框
 *
 * 处理逻辑
 * - 发送 name/email/password : 验证 name+password -- 通过验证且新邮箱没被占用 则修改邮箱。向新修改的邮箱中发送 token
 * - 发送 name : 验证通过则向先前绑定的 email 中发送 token
 *
 * 收到返回值 201 后
 * - 成员填入 token/(newname)/(newpassword) 当前页面获取 name
 *
 * 处理逻辑
 * - 发送 name/token/(newname)/(newpassword) :验证token 如果 token/name 匹配则完成迁移
 */

let migrateTokens = {};

/**
 * [处理函数] 验证 Discuz 用户的信息
 * post: /api/v1/migration/verify?name=<name>&password=<password>
 *
 * 验证其用户和密码
 * 若通过，则返回一个随机 token，用于完成下一步转换
 *
 * @param {Request} req
 * @param {Response} res
 */
async function verifyDiscuzMemberInfo (req, res) {
  let { name, password, email } = req.body;

  try {
    let memberInfo = await dbTool.commonMember.findOne({ username: name });

    if (!memberInfo) {
      return utils.errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }

    if (memberInfo.credentials.type !== 'discuz') {
      return utils.errorHandler(null, errorMessages.ALREADY_MIGRATED, 400, res);
    }

    if (!utils.env.isRelease) {
      // 没有激活码 || 不正确的激活码 || 激活码已被激活
      if (!req.body.code
        || !_.includes(await utils.member.getInviteCodes(), req.body.code)
        || await dbTool.commonMember.findOne({ inviteCode: req.body.code })) {
        return utils.errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
      }
    }

    // 如果需要修改邮箱
    if (email) {
      // 核对密码。
      if (!memberInfo.credentials.salt) {
        password = MD5(MD5(password).toLowerCase());
        if (password !== memberInfo.credentials.password) {
          return utils.errorHandler(null, errorMessages.BAD_PASSWORD, 401, res);
        }
      } else {
        password = MD5(memberInfo.credentials.salt + password);
        if (password !== memberInfo.credentials.password) {
          return utils.errorHandler(null, errorMessages.BAD_PASSWORD, 401, res);
        }
      }

      // 邮箱是否已被占用
      let existInfo = await dbTool.commonMember.findOne({ email: email });
      if (existInfo) {
        return errorHandler(null, errorMessages.EMAIL_EXIST, 400, res);
      }

      // 绑定新邮箱
      await dbTool.commonMember.updateOne(
        { _id: memberInfo._id },
        { $set: { email: email } }
      );
      memberInfo.email = email;
    }

    // 保存迁移 token，留着下一步使用
    let token = utils.createRandomString(6);
    if (utils.env.isMocha) token = 'kasora';
    await dbTool.token.findOneAndUpdate(
      {
        name: name,
        type: 'migration',
      },
      {
        type: 'migration',
        name: name,
        email: memberInfo.email,
        token: token,
        timeStamp: Date.now(),
        errorTimes: 0,
      },
      { upsert: true, returnOriginal: false }
    );

    // 将 token 发送至邮箱地址
    try {
      await utils.mail.sendVerificationCode(memberInfo.email, token);
    } catch (err) {
      return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
    }

    await dbTool.commonMember.updateOne(
      { _id: req.member._id },
      { $set: { inviteCode: req.body.code } }
    );

    return res.status(201).send({ status: 'ok' });
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
  let { name, newname, newpassword, token } = req.body;

  let tokenDoc = await dbTool.token.findOne({
    name: name,
    type: 'migration',
  });

  if (!tokenDoc || token !== tokenDoc.token) {
    // TODO: 添加失败计数。超过一定次数则暂时阻止该用户迁移。
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  if (Date.now() - tokenDoc.timestamp > config.password.tokenValidTime) {
    // FIXME: 未到时间却超时
    console.warn(`now:${Date.now()}\ntoken:${token}\ninfo:${migrateTokens[token]}\nvalidTime${config.password.tokenValidTime}`);
    return errorHandler(null, errorMessages.TIME_OUT, 400, res);
  }

  try {
    if (newname) {
      // 如果用户改名，则验证是否名称已被占用
      let existInfo = await dbTool.commonMember.findOne({ username: newname });
      if (existInfo) {
        return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
      }
    } else {
      newname = name;
    }

    // 加密密码，采用和新的密码杂凑方式
    let salt = utils.createRandomString();
    let newMemberInfo = {
      username: newname,
      credentials: {
        type: 'seraintalk',
        salt,
        password: MD5(salt + newpassword),
      },
    };

    await dbTool.commonMember.updateOne(
      { username: name },
      { $set: newMemberInfo }
    );

    await dbTool.token.deleteOne({ name: name });
    return res.status(201).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }
}

module.exports = {
  verifyDiscuzMemberInfo,
  performMigration,
};
