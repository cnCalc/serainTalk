'use strict';

let utils = require('../../utils');
const dbTool = require('../../utils/database');
const MD5 = require('../../utils/md5');
const config = require('../../config');
const jwt = require('jsonwebtoken');

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

let addMember = async (next) => {
  let existMember = await dbTool.db.collection('common_member').findOne({ username: memberInfo.username });
  if (!existMember) {
    memberInfo.credentials = {};
    memberInfo.credentials.salt = utils.createRandomString();
    memberInfo.credentials.type = 'seraintalk';
    memberInfo.credentials.password = MD5(memberInfo.credentials.salt + memberInfo.password);
    memberInfo.lastlogintime = Date.now();

    let res = await dbTool.db.collection('common_member').insertOne(memberInfo);

    memberInfo.mongoId = res.insertedId;
    existMember = memberInfo;
  }
  memberInfo = existMember;
  delete memberInfo.credentials;
  let memberToken = jwt.sign(memberInfo, config.jwtSecret);
  existMember.jwt = memberToken;
  await next(existMember);
  await dbTool.db.collection('common_member').deleteOne({ mongoId: memberInfo.mongoId });
};
