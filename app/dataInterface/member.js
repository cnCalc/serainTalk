'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

// region 注册登录部分
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

// 成员登录
let login = {
  body: {
    name: joi.string().required(),
    password: joi.string().required()
  }
};
exports.login = login;

// 注销
let logout = {};
exports.logout = logout;
// endregion

// region 成员信息部分

let info = {
  getById: {
    params: {
      id: interfaceUtils.mongoId.required()
    },
    query: {
      recent: interfaceUtils.flag,
      before: joi.number(),
    }
  },
  me: {},
  get: {
    params: {
      pagesize: interfaceUtils.pagesize,
      page: interfaceUtils.page
    },
    query: joi.object({
      name: joi.string(),
      device: joi.string()
    }).or('name', 'device')
  }
};
exports.info = info;

let setting = {
};
exports.setting = setting;

// endregion

// #region 成员密码部分
let password = {
  // 修改密码
  modify: {
    body: {
      password: joi.string().required()
    }
  },
  // 申请重置密码
  resetApplication: {
    body: {
      memberName: joi.string().required()
    }
  },
  // 重置密码
  reset: {
    body: {
      token: joi.string().required(),
      password: joi.string().required()
    }
  }
};
exports.password = password;
// #endregion
