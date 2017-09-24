'use strict';

const expect = require('chai').expect;
const dbTool = require('../../utils/database');
const testTools = require('./');
const { ObjectID } = require('mongodb');

exports = module.exports = {};

let discussionInfo = {
  title: 'test title',
  tags: [],
  category: '函数机综合讨论区',
  content: {
    encoding: 'html',
    content: 'test text',
  }
};
exports.discussionInfo = discussionInfo;

let discussionFakeInfo = {
  title: 'test title',
  tags: ['testtag'],
  category: '函数机综合讨论区',
  content: {
    encoding: 'html',
    content: 'test text',
  }
};
exports.discussionFakeInfo = discussionFakeInfo;

/**
 * [工具] 快速新建成员。
 * 后续操作完成后会将该成员销毁。
 *
 * @param {any} next 新建完成后需要执行的操作函数（需为 Promise）。会将新用户的信息与 cookie 作为参数传入。
 * @param {any} userinfo 选填，按指定用户信息新建用户。会更新自带成员的信息。
 */
let createOneDiscussion = async (agent, next, discussionInfo = testTools.discussionInfo) => {
  await dbTool.prepare();

  let url = '/api/v1/discussion/';
  let newDiscussion = await agent
    .post(url)
    .send(discussionInfo)
    .expect(201);
  expect(newDiscussion.body.status).to.equal('ok');
  let discussionId = newDiscussion._id;
  try {
    await next(newDiscussion.body.discussion);
  } catch (err) {
    await dbTool.discussion.removeOne({ _id: discussionId });
    throw err;
  }

  await dbTool.discussion.removeOne({ _id: discussionId });
};
exports.createOneDiscussion = createOneDiscussion;
