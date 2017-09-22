'use strict';

exports = module.exports = {};

let memberInfo = {
  gender: 2,
  birthyear: 1996,
  birthmonth: 8,
  birthday: 14,
  qq: '914714146',
  site: 'https://www.ntzyz.cn/',
  bio: '弱菜',
  username: 'test.zyz',
  email: 'ljy99041@163.com',
  regip: '114.232.38.5',
  regdate: 1335761157,
  device: 'Nspire CX CAS',
  password: 'fork you.'
};
exports.memberInfo = memberInfo;

exports.member = require('./memberTools');
