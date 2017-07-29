'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;

let utils = require('../../utils');
const dbTool = require('../../utils/database');

let agent = supertest.agent(require('../../index'));
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

let addMember = async () => {
  if (!(memberInfo.username && req.data.password && memberInfo.email)) {
    return utils.errorHandler(null, utils.errorMessages.LACK_INFO, 400, res);
  }

  try {
    let existMember = await dbTool.db.collection('common_member').findOne({ username: memberInfo.username });
    if (existMember) {
      return utils.errorHandler(null, utils.errorMessages.MEMBER_EXIST, 400, res);
    }
  } catch (err) {
    return utils.errorHandler(err, utils.errorMessages.DB_ERROR, 500, res);
  }

  memberInfo.credentials = {};
  memberInfo.credentials.salt = randomString.generate();
  memberInfo.credentials.type = 'seraintalk';
  memberInfo.credentials.password = MD5(memberInfo.credentials.salt + req.data.password);
  memberInfo.lastlogintime = Date.now();

  await dbTool.db.collection('common_member').insertOne(memberInfo);
};
