'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const MD5 = require('md5');
const randomString = require('randomstring');

const config = require('../config');
const dbTool = require('../utils/database');
const utils = require('../utils');

let router = express.Router();

let login = async (req, res, next) => {
  let userInfo;

  try {
    userInfo = await dbTool.db.collection('common_member').findOne({ username: req.params.username });
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  // 如果该账号是 discuz 转入的，强制修改密码。
  if (userInfo.credentials.type === 'discuz') {
    return utils.errorHandler(null, utils.errorMessages.RESET_PASSWORD, 400, res);
  }

  // 核对密码。
  let password = req.params.password;
  if (userInfo.credentials.salt === null) {
    password = MD5(MD5(password).toLowerCase());
    if (password !== userInfo.credentials.password) {
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  } else {
    password = MD5(userInfo.credentials.salt + password);
    if (password !== userInfo.credentials.password) {
      return utils.errorHandler(null, utils.errorMessages.BAD_PASSWORD, 400, res);
    }
  }

  // 删除登录凭证。
  delete userInfo.credentials;

  // 插入 userToken 作为身份识别码。
  let userToken = jwt.sign(userInfo, config.jwtSecret);
  res.cookie('usertoken', userToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', userinfo: userInfo });
};

let signup = async (req, res, next) => {
  let userInfo;

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
    'lastlogintime',
    'secques',
    'device'
  ];

  info.forEach(key => {
    if (req.params[key]) {
      userInfo[key] = req.params[key];
    }
  });

  if (!(userInfo.username && req.params.password && userInfo.email)) {
    return utils.errorHandler(null, utils.errorMessages.LACK_INFO, 400, res);
  }

  userInfo.credentials = {};
  userInfo.credentials.salt = randomString.generate();
  userInfo.credentials.type = 'seraintalk';
  userInfo.credentials.password = MD5(userInfo.credentials.salt + req.params.password);

  await dbTool.db.collection('common_member').insertOne(userInfo);

  delete userInfo.credentials;

  let userToken = jwt.sign(userInfo, config.jwtSecret);
  res.cookie('usertoken', userToken, { maxAge: config.cookie.renewTime });
  return res.status(201).send({ status: 'ok', userinfo: userInfo });
};

router.post('/login', login);
router.post('/signup', signup);
