'use strict';

const expect = require('chai').expect;
const dbTool = require('../../utils/database');
const { ObjectID } = require('mongodb');

const signupUrl = '/api/v1/member/signup';
const loginUrl = '/api/v1/member/login';

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

/**
 * [校验函数] 校验收到的成员信息是否与已知的相同。
 *
 * @param {any} receiveInfo 收到的成员信息。
 * @param {any} memberInfo 选填，原本的成员信息。默认为自带成员。
 */
let checkMemberInfo = (receiveInfo, tempMemberInfo = memberInfo) => {
  let _memberInfo = Object.assign({}, tempMemberInfo);
  expect(receiveInfo._id).to.not.be.null;
  expect(receiveInfo.credentials).to.not.be.ok;
  delete _memberInfo.password;
  Object.keys(_memberInfo).forEach(key => {
    expect(_memberInfo[key]).to.be.oneOf([receiveInfo[key], parseInt(receiveInfo[key])]);
  });
};
exports.checkMemberInfo = checkMemberInfo;

/**
 * [工具] 快速新建成员。
 * 后续操作完成后会将该成员销毁。
 *
 * @param {any} next 新建完成后需要执行的操作函数（需为 Promise）。会将新用户的信息作为参数传入。
 * @param {any} userinfo 选填，按指定用户信息新建用户。会更新自带成员的信息。
 */
let createOneMember = async (agent, next, tempMemberInfo = memberInfo) => {
  // 初始化数据库
  await dbTool.prepare();

  // 用户已存在则转为登录
  let newMemberBody;
  try {
    newMemberBody = await agent
      .post(signupUrl)
      .send(tempMemberInfo)
      .expect(201);
  } catch (err) {
    newMemberBody = await agent
      .post(loginUrl)
      .send({
        name: tempMemberInfo.username,
        password: tempMemberInfo.password
      })
      .expect(201);
  }

  // 简单的数据校验
  expect(newMemberBody.body.status).to.equal('ok');
  expect(newMemberBody.header['set-cookie']).to.be.ok;

  // 生成字符串版的 id 和 MongoID版的 _id
  let newMemberInfo = newMemberBody.body.memberinfo;
  newMemberInfo.id = newMemberInfo._id;
  newMemberInfo._id = ObjectID(newMemberInfo.id);
  // 补全必要信息
  newMemberInfo.password = tempMemberInfo.password;

  try {
    // 执行后续操作
    await next(newMemberInfo);
  } catch (err) {
    // 无论情况如何，清理临时用户
    await dbTool.commonMember.removeOne({ _id: newMemberInfo._id });
    throw err;
  }
  // 无论情况如何，清理临时用户
  await dbTool.commonMember.removeOne({ _id: newMemberInfo._id });
};
exports.createOneMember = createOneMember;

