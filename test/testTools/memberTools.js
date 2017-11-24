'use strict';

const expect = require('chai').expect;
const dbTool = require('../../utils/database');
const testTools = require('./');
const { ObjectID } = require('mongodb');

const signupUrl = '/api/v1/member/signup';
const loginUrl = '/api/v1/member/login';

exports = module.exports = {};

/**
 * [校验函数] 校验收到的成员信息是否与已知的相同。
 *
 * @param {any} receiveInfo 收到的成员信息。
 * @param {any} memberInfo 选填，原本的成员信息。默认为自带成员。
 */
let checkMemberInfo = (receiveInfo, tempMemberInfo) => {
  tempMemberInfo = tempMemberInfo || testTools.testObject.memberInfo;
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
 * 重新登录 刷新 agent 中的 token
 *
 * @param {Agent} agent superAgent 实例
 * @param {any} memberInfo 选填，按指定信息登录。
 */
let login = async (agent, memberInfo) => {
  await dbTool.prepare();

  memberInfo = memberInfo || testTools.testObject.memberInfo;
  let loginRes = await agent
    .post(loginUrl)
    .send({
      name: memberInfo.username,
      password: memberInfo.password
    })
    .expect(201);
  expect(loginRes.body.status).to.equal('ok');
  expect(loginRes.header['set-cookie']).to.be.ok;
};
exports.login = login;

/**
 * [工具] 快速新建成员。
 * 后续操作完成后会将该成员销毁。
 *
 * @param {Agent} agent superAgent 实例
 * @param {any} memberInfo 选填，按指定用户信息新建用户。会更新自带成员的信息。
 * @param {Promise} next 新建完成后需要执行的操作函数。会将新用户的信息作为参数传入。
 */
let createOneMember = async (agent, memberInfo, next) => {
  // 初始化数据库
  await dbTool.prepare();

  memberInfo = memberInfo || testTools.testObject.memberInfo;

  // 用户已存在则转为登录
  let newMemberBody;
  try {
    newMemberBody = await agent
      .post(signupUrl)
      .send(memberInfo)
      .expect(201);
  } catch (err) {
    newMemberBody = await agent
      .post(loginUrl)
      .send({
        name: memberInfo.username,
        password: memberInfo.password
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
  newMemberInfo.password = memberInfo.password;

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

/**
 * 将指定成员设置为管理员权限
 *
 * @param {MongoID} _id 要修改的成员的 mongoId
 * @param {Promise} next 之后要执行的后续操作
 */
let setAdmin = async (agent, _id, next) => {
  await dbTool.commonMember.updateOne(
    { _id: _id },
    { $set: { role: 'admin' } }
  );

  let memberInfo = await dbTool.commonMember.findOne({ _id: _id });

  // 刷新 token
  await login(agent, memberInfo);

  await next();

  await dbTool.commonMember.updateOne(
    { _id: _id },
    { role: 'member' }
  );
};
exports.setAdmin = setAdmin;
