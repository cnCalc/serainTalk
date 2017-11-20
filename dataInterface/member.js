'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

// 成员注册
let signup = {
  body: {
    username: joi.string().required(),
    password: joi.string().required(),
    email: joi.string().email().required(),

    gender: joi.number(),
    birthyear: joi.number(),
    birthmonth: joi.number(),
    birthday: joi.number(),
    address: joi.string(),
    qq: joi.string(),
    site: joi.string(),
    bio: joi.string(),
    regip: joi.string(),
    regdate: joi.number(),
    secques: joi.string(),
    device: joi.string()
  }
};
exports.signup = signup;

// region 成员信息部分

let info = {};

info.get = {
  params: {
    id: interfaceUtils.mongoId.required()
  },
  query: {
    recent: interfaceUtils.flag
  }
};

exports.info = info;

// endregion

// #region 成员密码部分
let password = {};
// 修改密码
password.modify = {
  body: {
    password: joi.string().required()
  }
};
// 申请重置密码
password.resetApplication = {
  body: {
    membername: joi.string().required()
  }
};
password.reset = {
  query: {
    token: joi.string().required(),
    password: joi.string().required()
  }
};
// #endregion
exports.password = password;
