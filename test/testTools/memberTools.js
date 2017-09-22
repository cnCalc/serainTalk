'use strict';

// const supertest = require('supertest');
const expect = require('chai').expect;
// let agent = supertest.agent(require('../../index'));

const dbTool = require('../../utils/database');
const testTools = require('./');
let utils = require('../../utils');

/**
 * [校验函数] 校验收到的成员信息是否与已知的相同。
 *
 * @param {any} receiveInfo 收到的成员信息。
 * @param {any} memberInfo 选填，原本的成员信息。默认为自带成员。
 */
let checkMemberInfo = (receiveInfo, memberInfo = testTools.memberInfo) => {
  let _memberInfo = Object.assign({}, memberInfo);
  expect(receiveInfo._id).to.not.be.null;
  expect(receiveInfo.credentials).to.not.be.ok;
  delete _memberInfo.password;
  Object.keys(_memberInfo).forEach(key => {
    expect(_memberInfo[key]).to.be.oneOf([receiveInfo[key], parseInt(receiveInfo[key])]);
  });
};

/**
 * [工具] 快速新建成员。
 * 后续操作完成后会将该成员销毁。
 *
 * @param {any} next 新建完成后需要执行的操作函数（需为 Promise）。会将新用户的信息与 cookie 作为参数传入。
 * @param {any} userinfo 选填，按指定用户信息新建用户。会更新自带成员的信息。
 */
let createOneUser = async (agent, next, userinfo = testTools.memberInfo) => {
  await dbTool.prepare();
  await dbTool.commonMember.removeOne({ username: testTools.memberInfo.username });

  let url = utils.url.createRESTfulUrl('/api/v1/member/signup', testTools.memberInfo);
  let signupInfo = await agent
    .post(url)
    .expect(201);
  expect(signupInfo.body.status).to.equal('ok');
  expect(signupInfo.header['set-cookie']).to.be.ok;

  try {
    await next(signupInfo.body.memberinfo);
  } catch (err) {
    await dbTool.commonMember.removeOne({ username: testTools.memberInfo.username });
    throw err;
  }

  await dbTool.commonMember.removeOne({ username: testTools.memberInfo.username });
};

module.exports = {
  checkMemberInfo,
  createOneUser
};
