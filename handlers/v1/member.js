'use strict';

const { ObjectID } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const utils = require('../../utils');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');
const joi = require('joi');
const { resloveMembersInDiscussionArray, resloveMembersInDiscussion } = require('../../utils/resolve-members');
const MD5 = utils.md5;

let router = express.Router();

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

    // 删除用户的登陆凭据部分
    utils.member.removePrivateField(memberInfo);

    // 获得此用户最近的帖子（如果需要）
    if (req.query.recent === 'on') {
      let beforeDate = req.query.before ? Number(req.query.before) : new Date().getTime();
      let recentPosts = await dbTool.db.collection('discussion').aggregate([
        {
          $match: {
            'posts.user': memberId
          }
        }, {
          $project: {
            title: 1,
            posts: {
              $filter: {
                input: '$posts',
                as: 'post',
                cond: { $eq: ['$$post.user', memberId] }
              }
            }
          }
        }, {
          $unwind: '$posts'
        }, {
          $sort: {
            'posts.createDate': -1
          }
        }, {
          $match: {
            'posts.createDate': { $lt: beforeDate }
          }
        }, {
          $limit: config.pagesize
        }
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
        members = await resloveMembersInDiscussion({ posts: tempPosts });
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
      sort: [['date', 'desc']]
    }
  ).toArray((err, results) => {
    /* istanbul ignore if */
    if (err) {
      errorHandler(null, errorMessages.DB_ERROR, 500, res);
    } else {
      // 删除所有用户的凭据部分
      results.forEach(result => utils.member.removePrivateField(result));
      res.send({
        status: 'ok',
        list: results
      });
    }
  });
};

/**
 * [处理函数] 查询指定成员创建的讨论
 * GET /api/v1/member/:id/discussions
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionUnderMember = async (req, res) => {
  if (!req.params.id) {
    return errorHandler(null, errorMessages.LACK_INFO, 400, res);
  }
  let memberId;
  try {
    memberId = ObjectID(req.params.id);
  } catch (err) {
    return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
  }

  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;
  try {
    let cursor = dbTool.discussion.find(
      { creater: memberId },
      { creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, lastMember: 1, replies: 1, category: 1 }
    ).sort({ createDate: -1 }).limit(pagesize).skip(offset * pagesize);
    let discussions = await cursor.toArray();
    let count = await cursor.count();
    let members = await resloveMembersInDiscussionArray(discussions);
    return res.send({ status: 'ok', discussions, members, count });
  } catch (err) {
    return errorHandler(null, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 获取自身信息
 *
 * @param {any} req
 * @param {any} res
 */
let getSelf = async (req, res) => {
  return res.status(200).send({ status: 'ok', memberInfo: req.member });
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
  let memberInfo = {};

  try {
    memberInfo = await dbTool.commonMember.findOne({ username: req.body.name }, { messages: 0 });
  } catch (err) {
    /* istanbul ignore next */
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

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
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  } else {
    password = MD5(memberInfo.credentials.salt + password);
    if (password !== memberInfo.credentials.password) {
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  }

  utils.member.removePrivateField(memberInfo);

  // 更新最后一次登录时间
  await dbTool.commonMember.updateOne({
    _id: memberInfo._id,
  }, {
    $set: { lastlogintime: new Date().getTime() }
  });

  // 插入 memberToken 作为身份识别码。
  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
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

  // 生成成员身份信息
  memberInfo.credentials = {};
  memberInfo.credentials.salt = utils.createRandomString();
  memberInfo.credentials.type = 'seraintalk';
  memberInfo.credentials.password = MD5(memberInfo.credentials.salt + req.body.password);
  memberInfo.lastlogintime = Date.now();

  try {
    await dbTool.commonMember.findOne({ username: memberInfo.username }, { messages: 0 });
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
    tokenInfo = jwt.sign(mailToken, config.jwtSecret);
  } catch (err) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  // 校验 token 数据
  joi.validate(tokenInfo, {
    memberId: dataInterface.object.mongoId.required(),
    password: joi.string().required(),
    time: joi.number().required()
  }, (err) => {
    return errorHandler(err, errorMessages.BAD_REQUEST, 400, res);
  });

  // 超时则报错
  if (Date.now() - tokenInfo.time > config.tokenValidTime) {
    return errorHandler(null, errorMessages.TIME_OUT, 403, res);
  }

  // 目标成员不存在则报错
  tokenInfo.memberId = ObjectID(tokenInfo.memberId);
  let memberInfo = await dbTool.commonMember.findOne({ _id: tokenInfo.memberId });
  if (!memberInfo) {
    return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
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
          lastlogintime: now
        }
      }
    );
  } catch (err) {
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
      name: req.body.membername
    });
    if (memberInfo) {
      let emailPayload = {
        memberId: memberInfo._id,
        password: memberInfo.credentials.password,
        time: Date.now()
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let url = `${config.password.resetPasswordPage}?token='${emailToken}'`;
      await utils.mail.sendMessage(memberInfo.email, url);
      return res.status(201).send({ status: 'ok' });
    } else {
      return errorHandler(null, errorMessages.NO_SUCH_MEMBER, 400, res);
    }
  } catch (err) {
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
        _id: req.member._id
      }, {
        $set: { credentials: credentials }
      }
    );
  } catch (err) {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
  return res.status(201).send({ status: 'ok' });
};

// #endregion

router.post('/password/reset/application', validation(dataInterface.member.password.resetApplication), resetPasswordApplication);
router.post('/password/reset', resetPassword);
router.put('/password', utils.middleware.verifyMember, validation(dataInterface.member.password.modify), passwordModify);
router.get('/me', utils.middleware.verifyMember, getSelf);
router.post('/login', login);
router.delete('/login', logout);
router.post('/signup', validation(dataInterface.member.signup), signup);
router.get('/:id', getMemberInfoById);
router.get('/', getMemberInfoGeneric);
router.get('/:id/discussions', getDiscussionUnderMember);

module.exports = router;
