'use strict';

const assert = require('assert');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const dbTool = require('../../database');
const randomString = require('../../utils/random-string');
const testTools = require('./');

// const signUpUrl = '/api/v1/member/signup';
const prepareSignupUrl = '/api/v1/member/signup/prepare';
const performSignupUrl = '/api/v1/member/signup/perform';
const loginUrl = '/api/v1/member/login';

exports = module.exports = {};
/**
 * [工具函数] 将成员信息转换为注册请求可接受的格式
 *
 * @param {any} memberInfo 成员信息
 * @return {any}
 */
let info2signUp = (memberInfo) => {
  let allowKeys = ['username', 'password', 'email', 'birthyear', 'birthmonth', 'token',
    'birthday', 'address', 'qq', 'site', 'bio', 'regip', 'regdate', 'secques', 'device'];
  let tempMemberInfo = {};
  for (let key of allowKeys) {
    if (memberInfo[key]) tempMemberInfo[key] = memberInfo[key];
  }
  return tempMemberInfo;
};

/**
 * [工具函数] 校验收到的成员信息是否与已知的相同。
 *
 * @param {any} receiveInfo 收到的成员信息。
 * @param {any} memberInfo 选填，原本的成员信息。默认为自带成员。
 */
let checkMemberInfo = (receiveInfo, tempMemberInfo) => {
  tempMemberInfo = tempMemberInfo || testTools.testObject.memberInfo;
  let _memberInfo = Object.assign({}, tempMemberInfo);
  assert(receiveInfo._id !== null);
  assert(!receiveInfo.credentials);
  delete _memberInfo.password;
  delete _memberInfo.email;
  Object.keys(_memberInfo).forEach(key => {
    if (receiveInfo[key] !== undefined) {
      assert(
        [receiveInfo[key], parseInt(receiveInfo[key])].indexOf(_memberInfo[key]) !== -1
      );
    }
  });
};
exports.checkMemberInfo = checkMemberInfo;

/**
 * 重新登录 刷新 agent 中的 token
 *
 * @param {Agent} agent superAgent 实例
 * @param {any} memberInfo 选填，按指定信息登录。
 */
let login = async (agent, memberInfo, next) => {
  await dbTool.prepare();

  let cookie = agent.jar.getCookie('membertoken', { path: '/' });

  memberInfo = memberInfo || testTools.testObject.memberInfo;
  let loginRes = await agent
    .post(loginUrl)
    .send({
      name: memberInfo.username,
      password: memberInfo.password,
    })
    .expect(201);

  await next();

  agent.jar.setCookie(cookie);

  assert(loginRes.body.status === 'ok');
  assert(loginRes.header['set-cookie']);
};
exports.login = login;

/**
 * 退出登录 刷新 agent 中的 token
 *
 * @param {Agent} agent superAgent 实例
 * @param {any} memberInfo 选填，按指定信息登录。
 */
let logout = async (agent, next) => {
  await dbTool.prepare();

  let cookie = agent.jar.getCookie('membertoken', { path: '/' });

  await agent
    .delete(loginUrl)
    .expect(204);

  await next();

  agent.jar.setCookie(cookie);
};
exports.logout = logout;

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
  let tempMemberInfo = JSON.parse(JSON.stringify(testTools.testObject.memberInfo));
  if (memberInfo) _.merge(tempMemberInfo, memberInfo);

  let cookie = agent.jar.getCookie('membertoken', { path: '/' });

  // name 已存在则随机生成一个新的 name
  let newMemberBody;

  try {
    await agent
      .post(prepareSignupUrl)
      .send({ email: tempMemberInfo.email })
      .expect(201);
  } catch (err) {
    await agent
      .post(prepareSignupUrl)
      .send({ email: randomString() + '@local.lan' })
      .expect(201);
  }

  delete tempMemberInfo.email;
  tempMemberInfo.token = 'kasora';

  try {
    newMemberBody = await agent
      .post(performSignupUrl)
      .send(info2signUp(tempMemberInfo))
      .expect(201);
  } catch (err) {
    tempMemberInfo.username = randomString();

    newMemberBody = await agent
      .post(performSignupUrl)
      .send(info2signUp(tempMemberInfo))
      .expect(201);
  }

  // 简单的数据校验
  assert(newMemberBody.body.status === 'ok');
  assert(newMemberBody.header['set-cookie']);

  // 生成字符串版的 id 和 MongoID版的 _id
  let newMemberInfo = newMemberBody.body.memberinfo;
  newMemberInfo.id = newMemberInfo._id;
  newMemberInfo._id = ObjectID(newMemberInfo.id);
  // 补全必要信息
  newMemberInfo.password = tempMemberInfo.password;

  try {
    // 执行后续操作
    await next(newMemberInfo);
    agent.jar.setCookie(cookie);
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
  await login(agent, memberInfo, next);

  await dbTool.commonMember.updateOne(
    { _id: _id },
    { $set: { role: 'member' } }
  );
};
exports.setAdmin = setAdmin;
