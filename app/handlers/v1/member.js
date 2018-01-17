'use strict';

const joi = require('joi');
const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');

const config = require('../../../config');
const dbTool = require('../../../database');
const dataInterface = require('../../dataInterface');
const utils = require('../../../utils');
const MD5 = utils.md5;
const { errorHandler, errorMessages } = utils;
const { resolveMembersInDiscussion } = utils.resolveMembers;

/**
 * 根据用户 ID 获得用户信息以及最近活动
 * /api/v1/member/:id[?recent=(on|off)]
 * @param {Request} req
 * @param {Response} res
 */
let getMemberInfoById = async (req, res, next) => {
  let memberId = ObjectID(req.params.id);

  // 查询用户的基础信息
  try {
    let memberInfo = await dbTool.commonMember.findOne({ _id: memberId });
    if (!memberInfo) {
      return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 400, res);
    }

    // 删除用户的敏感信息部分
    utils.member.removeSensitiveField(memberInfo);

    // 获得此用户最近的帖子（如果需要）
    if (req.query.recent === 'on') {
      // 鉴权 能否读取白名单分类中的讨论
      if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
        return res.status(200).send({ status: 'ok', member: memberInfo });
      }
      let beforeDate = req.query.before ? Number(req.query.before) : new Date().getTime();
      let query = {
        $match: {
          'posts.user': memberId,
        },
      };
      // 鉴权 能否读取所有分类中的讨论
      if (!await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
        query.$match.category = { $in: config.discussion.category.whiteList };
      }
      let recentPosts = await dbTool.db.collection('discussion').aggregate([
        query,
        {
          $project: {
            title: 1,
            posts: {
              $filter: {
                input: '$posts',
                as: 'post',
                cond: { $eq: ['$$post.user', memberId] },
              },
            },
          },
        }, {
          $unwind: '$posts',
        }, {
          $sort: {
            'posts.createDate': -1,
          },
        }, {
          $match: {
            'posts.createDate': { $lt: beforeDate },
          },
        }, {
          $limit: config.pagesize,
        },
      ]).toArray();
      memberInfo.recentActivities = recentPosts;
      memberInfo.recentActivities.forEach(discussion => {
        discussion.posts = utils.renderer.renderPost(discussion.posts);
      });

      let tempPosts = [];
      memberInfo.recentActivities.forEach(discussion => {
        tempPosts.push(discussion.posts);
      });

      let members;
      try {
        members = await resolveMembersInDiscussion({ posts: tempPosts });
      } catch (err) {
        members = {};
      }
      return res.status(200).send({ status: 'ok', member: memberInfo, members: members });
    }

    // 不需要，直接发送
    return res.status(200).send({ status: 'ok', memberinfo: memberInfo });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * 查询符合用户名/主力设备的用户信息
 * /api/v1/members?name=<name>
 * /api/v1/members?device=<device>
 * @param {Request} req
 * @param {Response} res
 */
let getMemberInfoGeneric = (req, res) => {
  let query = {};
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page) || 0;

  if (req.query.name) {
    query.username = req.query.name;
  } else if (req.query.device) {
    query.device = req.query.device;
  } else {
    errorHandler(null, 'name or device is required.', 400, res);
    return;
  }

  dbTool.db.collection('common_member').find(
    query,
    { messages: 0 },
    {
      limit: pagesize,
      skip: offset * pagesize,
      sort: [['date', 'desc']],
    }
  ).toArray((err, results) => {
    /* istanbul ignore if */
    if (err) {
      errorHandler(null, errorMessages.DB_ERROR, 500, res);
    } else {
      // 删除所有用户的凭据部分
      results.forEach(result => utils.member.removeSensitiveField(result));
      res.send({
        status: 'ok',
        list: results,
      });
    }
  });
};

/**
 * [处理函数] 获取自身信息
 *
 * @param {any} req
 * @param {any} res
 */
let getSelf = async (req, res) => {
  req.member._id = req.member.id;
  let ignores = await dbTool.commonMember.aggregate([
    { $match: { _id: req.member._id } },
    { $project: { ignores: 1 } },
  ]).toArray();
  delete req.member.id;
  req.member.ignores = ignores;
  return res.status(200).send({ status: 'ok', memberInfo: req.member });
};

/**
 * 用户修改设置
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let updateSettings = async (req, res, next) => {
  try {
    let settings = req.body;
    let updateInfo = {};
    let settingPath = req.params[0];

    if (req.params[0]) {
      // 如果细分请求则读取 value
      let settingParams = settingPath.replace(/\//g, '.');
      updateInfo[`settings.${settingParams}`] = settings.value;
    } else {
      // 否则直接覆盖对应字段
      for (let key of Object.keys(settings)) {
        updateInfo[`settings.${key}`] = settings[key];
      }
    }
    let updateDoc = await dbTool.commonMember.findOneAndUpdate(
      { _id: req.member._id },
      {
        $set: updateInfo,
      },
      { returnOriginal: false }
    );
    return res.status(201).send({ status: 'ok', settings: updateDoc.value.settings });
  } catch (err) {
    errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

// #region 成员登录登出部分
/**
 * [处理函数] 登录
 * post: /api/v1/member/login
 *
 * @param {any} req 请求
 * @param {any} res 回复
 */
let login = async (req, res) => {
  try {
    let memberInfo = await dbTool.commonMember.findOne(
      { username: req.body.name },
      { notifications: 0 }
    );

    // 不存在则报错
    if (!memberInfo) {
      return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
    };

    // 如果该账号是 discuz 转入的，强制修改密码。
    /* istanbul ignore if */
    if (memberInfo.credentials.type === 'discuz') {
      return utils.errorHandler(null, utils.errorMessages.RESET_PASSWORD, 400, res);
    }

    // 核对密码。
    let password = req.body.password;
    /* istanbul ignore if */
    if (memberInfo.credentials.salt === null) {
      password = MD5(MD5(password).toLowerCase());
      if (password !== memberInfo.credentials.password) {
        return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 401, res);
      }
    } else {
      password = MD5(memberInfo.credentials.salt + password);
      if (password !== memberInfo.credentials.password) {
        return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 401, res);
      }
    }

    // 移除敏感信息
    utils.member.removePrivateField(memberInfo);

    // 更新最后一次登录时间
    await dbTool.commonMember.updateOne(
      { _id: memberInfo._id },
      { $set: { lastlogintime: Date.now() } }
    );

    // 插入 memberToken 作为身份识别码。
    let memberToken = jwt.sign(memberInfo, config.jwtSecret);
    res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
    return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
  } catch (err) {
    /* istanbul ignore next */
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 登出
 * post: /api/v1/member/login
 * @param {any} req 请求
 * @param {any} res 回复
 */
let logout = async (req, res) => {
  await res.clearCookie('membertoken');
  return res.status(204).send({ status: 'ok' });
};

/**
 * [处理函数] 注册
 * post: /api/v1/member/signup?name=<name>&password=<password>
 * @param {any} req 请求
 * @param {any} res 回复
 */
let signup = async (req, res) => {
  let memberInfo = req.body;

  memberInfo.role = 'member';

  // 生成成员身份信息
  memberInfo.credentials = {};
  memberInfo.credentials.salt = utils.createRandomString();
  memberInfo.credentials.type = 'seraintalk';
  memberInfo.credentials.password = MD5(memberInfo.credentials.salt + req.body.password);
  memberInfo.lastlogintime = Date.now();

  try {
    let tempMemberInfo = await dbTool.commonMember.findOne(
      { username: memberInfo.username },
      { notifications: 0, credentials: 0 }
    );
    if (tempMemberInfo) return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
  } catch (err) {
    /* istanbul ignore next */
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  await dbTool.commonMember.insertOne(memberInfo);

  utils.member.removePrivateField(memberInfo);

  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
};
// #endregion

// #region 成员密码部分
/**
 * [处理函数] 重置成员密码
 *
 * @param {any} req
 * @param {any} res
 */
let resetPassword = async (req, res) => {
  let newPassword = req.body.password;
  let mailToken = req.body.token;

  // 身份验证
  let tokenInfo;
  try {
    tokenInfo = jwt.verify(mailToken, config.jwtSecret);
    delete tokenInfo.iat;
    // 校验 token 数据
    joi.validate(tokenInfo, {
      memberId: dataInterface.object.mongoId.required(),
      password: joi.string().required(),
      time: joi.number().required(),
    }, (err) => {
      if (err) throw err;
    });
  } catch (err) {
    return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
  }

  // 超时则报错
  if (Date.now() - tokenInfo.time > config.password.tokenValidTime) {
    return errorHandler(null, errorMessages.TIME_OUT, 403, res);
  }

  // 目标成员不存在则报错
  tokenInfo.memberId = ObjectID(tokenInfo.memberId);
  let memberInfo = await dbTool.commonMember.findOne({ _id: tokenInfo.memberId });
  if (!memberInfo) {
    return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 400, res);
  }

  // 密码不匹配则报错
  if (tokenInfo.password !== memberInfo.credentials.password) {
    return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
  }

  // 生成新的身份信息
  let credentials = {};
  credentials.salt = utils.createRandomString();
  credentials.type = 'seraintalk';
  credentials.password = MD5(credentials.salt + newPassword);

  // 更新身份信息
  let now = Date.now();
  memberInfo.lastlogintime = now;
  try {
    await dbTool.commonMember.updateOne(
      { _id: tokenInfo.memberId },
      {
        $set: {
          credentials: credentials,
          lastlogintime: now,
        },
      }
    );
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }

  utils.member.removePrivateField(memberInfo);

  // 返回登录 token
  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok' });
};

/**
 * [处理函数] 申请重置成员密码
 *
 * @param {any} req
 * @param {any} res
 */
let resetPasswordApplication = async (req, res) => {
  try {
    let memberInfo = await dbTool.commonMember.findOne({
      username: req.body.memberName,
    });
    if (memberInfo) {
      let emailPayload = {
        memberId: memberInfo._id,
        password: memberInfo.credentials.password,
        time: Date.now(),
      };

      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let url = `${config.password.resetPasswordPage}?token='${emailToken}'`;
      await utils.mail.sendMessage(memberInfo.email, url);
      return res.status(201).send({ status: 'ok' });
    } else {
      return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 400, res);
    }
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

/**
 * [处理函数] 修改成员密码
 *
 * @param {any} req
 * @param {any} res
 * @returns
 */
let passwordModify = async (req, res) => {
  // 生成成员身份信息
  let credentials = {};
  credentials.salt = utils.createRandomString();
  credentials.type = 'seraintalk';
  credentials.password = MD5(credentials.salt + req.body.password);
  try {
    await dbTool.commonMember.updateOne(
      {
        _id: req.member._id,
      }, {
        $set: { credentials: credentials },
      }
    );
  } catch (err) {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
  return res.status(201).send({ status: 'ok' });
};
// #endregion

module.exports = {
  getMemberInfoById,
  getMemberInfoGeneric,
  getSelf,
  login,
  logout,
  passwordModify,
  resetPassword,
  resetPasswordApplication,
  signup,
  updateSettings,
};
