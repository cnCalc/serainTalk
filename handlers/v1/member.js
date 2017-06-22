'use strict';

const { ObjectID } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const MD5 = require('md5');
const randomString = require('randomstring');

const config = require('../../config');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const utils = require('../../utils');

let router = express.Router();

/**
 * 根据用户 ID 获得用户信息以及最近活动
 * /api/v1/member/:id[?recent=(on|off)]
 * @param {Request} req
 * @param {Response} res
 */
let getMemberInfoById = async (req, res) => {
  if (!req.params.id) {
    return errorHandler(null, 'missing member id', 400, res);
  }
  let memberId;
  try {
    memberId = ObjectID(req.params.id);
  } catch (err) {
    return errorHandler(null, 'invalid member id', 400, res);
  }
  // 查询用户的基础信息
  try {
    let results = dbTool.db.collection('common_member').find({ _id: memberId }).toArray();
    if (results.length !== 1) {
      res.send({
        status: 'ok',
      });
    } else {
      let result = Object.assign({
        status: 'ok'
      }, results[0]);

      // 删除用户的登陆凭据部分
      delete result['credentials'];

      // 获得此用户最近的帖子（如果需要）
      if (req.query.recent === 'on') {
        dbTool.db.collection('discussion').aggregate([{
          $match: {
            'participants': memberId
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
          $sort: {
            'posts.createDate': -1
          }
        }, {
          $limit: 50
        }]).toArray((err, docs) => {
          if (err) {
            result.recentActivities = null;
          } else {
            result.recentActivities = docs;
          }
          res.send(result);
        });
      } else {
        // 不需要，直接发送
        res.send(result);
      }
    }
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

  dbTool.db.collection('common_member').find(query, {
    limit: pagesize,
    skip: offset * pagesize,
    sort: [['date', 'desc']]
  }).toArray((err, results) => {
    if (err) {
      errorHandler(null, errorMessages.DB_ERROR, 500, res);
    } else {
      // 删除所有用户的凭据部分
      results.forEach(result => delete result['credentials']);
      res.send({
        status: 'ok',
        list: results
      });
    }
  });
};

/**
 * [处理函数] 登录
 * post: /api/v1/member/login?name=<name>&password=<password>
 * @param {any} req 请求
 * @param {any} res 回复
 */
let login = async (req, res) => {
  let memberInfo = {};

  try {
    memberInfo = await dbTool.db.collection('common_member').findOne({ username: req.data.name });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  // 如果该账号是 discuz 转入的，强制修改密码。
  if (memberInfo.credentials.type === 'discuz') {
    return utils.errorHandler(null, utils.errorMessages.RESET_PASSWORD, 400, res);
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

  // 删除登录凭证。
  delete memberInfo.credentials;

  // 插入 userToken 作为身份识别码。
  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
};

/**
 * [处理函数] 登录
 * post: /api/v1/member/signup?name=<name>&password=<password>
 * @param {any} req 请求
 * @param {any} res 回复
 */
let signup = async (req, res) => {
  let memberInfo = {};

  let info = [
    'gender',
    'birthyear',
    'birthmonth',
    'birthday',
    'address',
    'qq',
    'site',
    'bio',
    'username',
    'email',
    'regip',
    'regdate',
    'secques',
    'device'
  ];

  info.forEach(key => {
    if (req.data[key]) {
      memberInfo[key] = req.data[key];
    }
  });

  if (!(memberInfo.username && req.data.password && memberInfo.email)) {
    return utils.errorHandler(null, utils.errorMessages.LACK_INFO, 400, res);
  }

  let existMember;
  try {
    existMember = await dbTool.db.collection('common_member').findOne({ username: memberInfo.username });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }
  if (existMember) {
    return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
  }

  memberInfo.credentials = {};
  memberInfo.credentials.salt = randomString.generate();
  memberInfo.credentials.type = 'seraintalk';
  memberInfo.credentials.password = MD5(memberInfo.credentials.salt + req.data.password);
  memberInfo.lastlogintime = Date.now();

  await dbTool.db.collection('common_member').insertOne(memberInfo);

  delete memberInfo.credentials;

  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
};

router.post('/login', login);
router.post('/signup', signup);
router.get('/:id', getMemberInfoById);
router.get('/', getMemberInfoGeneric);

module.exports = router;
