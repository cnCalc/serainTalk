'use strict';

const joi = require('joi');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');

const config = require('../../../config');
const dbTool = require('../../../database');
const dataInterface = require('../../dataInterface');
const utils = require('../../../utils');
const { md5: MD5, sha256: SHA256 } = utils;

const promisify = utils.promisify;
const { errorHandler, errorMessages } = utils;
const { resolveMembersInDiscussion } = utils.resolveMembers;

// #region 成员信息部分

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
    let memberInfo = await dbTool.commonMember.findOne({
      _id: memberId,
      'credentials.type': {
        $ne: 'deleted',
      },
    });
    if (!memberInfo) {
      return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
    }

    if (memberInfo.settings && memberInfo.settings.allowShowOnlineStatus) {
      // 用户允许公开自己的在线状态，根据 WebSocket 连接情况判断是否在线
      if (utils.websocket.connections[memberInfo._id] && utils.websocket.connections[memberInfo._id].length > 0) {
        memberInfo.online = true;
      } else {
        memberInfo.online = false;
      }
    }

    // 删除用户的敏感信息部分
    await utils.member.removeSensitiveField(memberInfo, req.member.permissions);

    // 获得此用户最近的帖子（如果需要）
    if (req.query.recent) {
      // 鉴权 能否读取白名单分类中的讨论
      if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
        return res.status(200).send({ status: 'ok', member: memberInfo });
      }
      let beforeDate = req.query.before ? Number(req.query.before) : new Date().getTime();
      let query = {
        $match: {
          'posts.user': memberId,
          'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] },
          category: { $in: config.discussion.category.whiteList },
        },
      };
      let postQuery = {
        $and: [
          { $eq: ['$$post.user', memberId] },
          { $in: ['$$post.status.type', [config.discussion.status.ok]] },
        ],
      };
      // 鉴权 能否读取所有分类中的讨论
      if (await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
        delete query.$match.category;
      }
      if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
        delete query.$match['status.type'];
        postQuery.$and = postQuery.$and.filter(q => !q.$in || q.$in[0] !== '$$post.status.type');
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
                cond: postQuery,
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
        await Promise.all(Object.keys(members).map(async memberId => {
          members[memberId] = await utils.member.removeSensitiveField(members[memberId], req.member.permissions);
        }));
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
let getMemberInfoGeneric = async (req, res) => {
  let query = {};
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = (Number(req.query.page) || 1) - 1;

  if (req.query.name) {
    query.username = req.query.name;
  } else if (req.query.device) {
    query.device = req.query.device;
  } else {
    errorHandler(null, 'name or device is required.', 400, res);
    return;
  }

  let results;
  try {
    results = await dbTool.commonMember.find(
      query,
      { messages: 0 }
    ).skip(offset * pagesize).limit(pagesize).toArray();
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }

  // 删除所有用户的凭据部分
  for (let result of results) await utils.member.removeSensitiveField(result, req.member.permissions);
  return res.send({
    status: 'ok',
    list: results,
  });
};

let memberStartWith = async (req, res, next) => {
  let subName = req.query.subName || req.params.subName;
  let pagesize = req.query.pagesize;
  let page = req.query.page - 1;

  let memberDoc = await dbTool.commonMember.find({
    username: RegExp('^' + subName, 'i'),
  }).skip(page * pagesize).limit(pagesize).project({ username: 1 }).toArray();
  return res.status(200).send({ status: 'ok', members: memberDoc });
};

let uploadAvatar = async (req, res, next) => {
  try {
    let { left, top, width, height } = req.query;

    if (!req.file) {
      return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
    }

    let avatar = {
      _id: new ObjectID(),
      _owner: req.member._id,
      type: 'avatar',
      fileName: req.file.originalname,
      filePath: req.file.filename,
      size: req.file.size,
      status: 'ok',
      referer: [],
    };

    if (width && height) {
      try {
        let optName = req.file.filename.split('.').filter(part => part !== 'temp').join('.');
        let optPath = req.file.path.split('.').filter(part => part !== 'temp').join('.');
        await utils.upload.sharpImage(req.file.path, optPath, { left: left, top: top, width: width, height: height });

        avatar.filePath = optName;
        await promisify(fs.unlink)(req.file.path);
        let stat = await promisify(fs.stat)(optPath);
        avatar.size = stat.size;
      } catch (err) {
        return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
      }
    }

    const mime = await utils.mime.getMIME(path.join(config.upload.avatar.path, avatar.filePath));
    avatar.mime = mime;

    await dbTool.attachment.insertOne(avatar);

    // 对成员隐藏路径信息
    delete avatar.filePath;

    // 更新用户信息
    let info = {
      avatar: `/api/v1/attachment/${avatar._id}`,
    };
    await dbTool.commonMember.findOneAndUpdate(
      { _id: req.member._id },
      { $set: info },
      { returnOriginal: false }
    );

    return res.status(201).send({ status: 'ok', avatar: avatar });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
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
      { $set: updateInfo },
      { returnOriginal: false }
    );
    let memberInfo = updateDoc.value;
    await utils.member.removeSensitiveField(memberInfo, req.member.permissions);
    let memberToken = jwt.sign({ id: memberInfo._id.toString() }, config.jwtSecret);
    res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
    return res.status(201).send({ status: 'ok', settings: updateDoc.value.settings });
  } catch (err) {
    errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

let updateMemberInfo = async (req, res, next) => {
  let { bio, device } = req.body;
  let info = {};
  if (bio !== undefined) info.bio = bio;
  if (device !== undefined) info.device = device;

  if (Object.keys(info).length === 0) {
    return res.status(200).send({ status: 'ok' });
  }

  try {
    let updateDoc = await dbTool.commonMember.findOneAndUpdate(
      { _id: req.member._id },
      { $set: info },
      { returnOriginal: false }
    );
    let memberInfo = updateDoc.value;
    await utils.member.removeSensitiveField(memberInfo, req.member.permissions);
    return res.status(201).send({ status: 'ok', memberInfo: memberInfo });
  } catch (err) {
    errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

let verifyEmail = async (req, res, next) => {
  let { email } = req.body;
  let token = utils.env.isMocha ? '000000' : utils.createRandomString(6);
  await dbTool.token.findOneAndUpdate(
    {
      memberId: req.member._id,
      type: 'resetEmail',
    },
    {
      $set: {
        type: 'resetEmail',
        memberId: req.member._id,
        email: email,
        token: token,
        timeStamp: Date.now(),
        errorTimes: 0,
      },
    },
    { upsert: true, returnOriginal: false }
  );
  await utils.mail.sendVerificationCode(email, { token });
  return res.status(201).send({ status: 'ok' });
};

let updateEmail = async (req, res, next) => {
  let { token } = req.body;
  let tokenInfo = await dbTool.token.findOne(
    {
      memberId: req.member._id,
      type: 'resetEmail',
    }
  );

  if (!tokenInfo || tokenInfo.token !== token) {
    // TODO: 添加失败计数。超过一定次数则暂时阻止该用户迁移。
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  if (Date.now() - tokenInfo.timestamp > config.password.tokenValidTime) {
    return errorHandler(null, errorMessages.TOKEN_EXPIRED, 400, res);
  }

  let updateDoc = await dbTool.commonMember.findOneAndUpdate(
    { _id: req.member._id },
    { $set: { email: tokenInfo.email } },
    { returnOriginal: false }
  );
  let memberInfo = updateDoc.value;
  await utils.member.removeSensitiveField(memberInfo, req.member.permissions);

  return res.status(201).send({ status: 'ok', memberInfo: memberInfo });
};

// #endregion

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
      {
        $or: [
          { username: req.body.name },
          { email: req.body.name },
        ],
      },
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
      password = MD5(SHA256(password));
      if (password !== memberInfo.credentials.password) {
        return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 401, res);
      }
    } else {
      password = MD5(memberInfo.credentials.salt + SHA256(password));
      if (password !== memberInfo.credentials.password) {
        return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 401, res);
      }
    }

    // 移除敏感信息
    await utils.member.removePrivateField(memberInfo, req.member.permissions);

    // 更新最后一次登录时间
    await dbTool.commonMember.updateOne(
      { _id: memberInfo._id },
      { $set: { lastlogintime: Date.now() } }
    );

    // 插入 memberToken 作为身份识别码。
    let memberToken = jwt.sign({ id: memberInfo._id.toString() }, config.jwtSecret);
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
 * [处理函数] 账户注册前的验证邮箱
 * post: /api/v1/member/signup/prepare
 * body: {
 *   email: string,
 * }
 * @param {*} req
 * @param {*} res
 */
let prepareSignup = async (req, res) => {
  const { email } = req.body;

  // 邮箱是否已被占用
  let existInfo = await dbTool.commonMember.findOne({ email: email });
  if (existInfo) {
    return errorHandler(null, errorMessages.EMAIL_EXIST, 400, res);
  }
  // TODO: 检查 token 冲突

  // 保存 token
  let token = utils.createRandomString(6);
  if (utils.env.isMocha) token = 'kasora';
  await dbTool.token.replaceOne(
    {
      email,
      type: 'signup',
    },
    {
      email,
      type: 'signup',
      token,
      timeStamp: Date.now(),
      errorTimes: 0,
    },
    { upsert: true, returnOriginal: false }
  );

  // 将 token 发送至邮箱地址
  try {
    let link = `${config.siteAddress}/signup?token=${token}`;
    await utils.mail.sendVerificationCode(email, { token, link });
  } catch (err) {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }

  return res.status(201).send({ status: 'ok' });
};

/**
 * [处理函数] 执行注册
 * POST: /api/v1/member/signup/perform
 * @param {*} req
 * @param {*} res
 */
let performSignup = async (req, res) => {
  let memberInfo = req.body;
  let { token } = memberInfo;

  // 校验 token 并获得邮箱地址
  const tokenInfo = await dbTool.token.findOne({
    token,
    type: 'signup',
  });

  if (!tokenInfo
    || tokenInfo.timeStamp <= Date.now() - config.password.tokenValidTime
    || tokenInfo.errorTimes > config.password.errorTimes) {
    return errorHandler(null, errorMessages.BAD_VERIFICATION_CODE, 400, res);
  }

  memberInfo.role = 'member';
  memberInfo.email = tokenInfo.email;

  // 生成成员身份信息
  memberInfo.credentials = {};
  memberInfo.credentials.salt = utils.createRandomString();
  memberInfo.credentials.type = 'seraintalk';
  memberInfo.credentials.password = MD5(memberInfo.credentials.salt + SHA256(req.body.password));
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

  await utils.member.removePrivateField(memberInfo, req.member.permissions);

  let memberToken = jwt.sign({ id: memberInfo._id.toString() }, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });

  await dbTool.token.deleteMany({
    type: 'signup',
    $or: [
      {
        token,
      }, {
        timeStamp: { $lte: Date.now() - config.password.tokenValidTime },
      }, {
        errorTimes: { $gt: config.password.errorTimes },
      },
    ],
  });

  return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
};

/**
 * [处理函数] 删除用户
 * DELETE: /api/v1/member/:id
 * @param {*} req
 * @param {*} res
 */
let purgeMember = async (req, res) => {
  if (!await utils.permission.checkPermission('member-memberDelete', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  const memberId = ObjectID(req.params.id);

  await Promise.all([
    dbTool.discussion.deleteMany({
      creator: memberId,
    }),
    dbTool.commonMember.updateOne({
      _id: memberId,
    }, {
      $set: {
        'credentials.type': 'deleted',
      },
    }),
  ]);

  res.status(200).send({
    status: 'ok',
  });
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
    return errorHandler(null, errorMessages.TOKEN_EXPIRED, 403, res);
  }

  // 目标成员不存在则报错
  tokenInfo.memberId = ObjectID(tokenInfo.memberId);
  let memberInfo = await dbTool.commonMember.findOne({ _id: tokenInfo.memberId });
  if (!memberInfo) {
    return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
  }

  // 密码不匹配则报错
  if (tokenInfo.password !== memberInfo.credentials.password) {
    return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
  }

  // 生成新的身份信息
  let credentials = {};
  credentials.salt = utils.createRandomString();
  credentials.type = 'seraintalk';
  credentials.password = MD5(credentials.salt + SHA256(newPassword));

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

  await utils.member.removePrivateField(memberInfo, req.member.permissions);

  // 返回登录 token
  let memberToken = jwt.sign({ id: memberInfo._id.toString() }, config.jwtSecret);
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
      // 迁移后才可修改密码
      if (memberInfo.credentials.type === 'discuz') {
        return utils.errorHandler(null, utils.errorMessages.RESET_PASSWORD, 400, res);
      }

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
      return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
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
  credentials.password = MD5(credentials.salt + SHA256(req.body.password));
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
  memberStartWith,
  passwordModify,
  resetPassword,
  resetPasswordApplication,
  prepareSignup,
  performSignup,
  updateEmail,
  updateMemberInfo,
  updateSettings,
  uploadAvatar,
  verifyEmail,
  purgeMember,
};
