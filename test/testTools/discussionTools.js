'use strict';

const expect = require('chai').expect;
const dbTool = require('../../utils/database');
const testTools = require('./');
const { ObjectID } = require('mongodb');

exports = module.exports = {};

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
 * [工具] 快速新建讨论。
 * 后续操作完成后会将该讨论销毁。
 *
 * @param {any} next 新建完成后需要执行的操作函数（需为 Promise）。会将新讨论的信息作为参数传入。
 * @param {any} userinfo 选填，按指定讨论信息新建讨论。会更新默认讨论的信息。
 */
let createOneDiscussion = async (agent, next, discussionInfo = testTools.testObject.discussionInfo) => {
  await dbTool.prepare();

  let url = '/api/v1/discussion';

  let newDiscussionRes = await agent
    .post(url)
    .send(discussionInfo);
  try {
    expect(newDiscussionRes.statusCode).to.be.equal(201);
    expect(newDiscussionRes.body.status).to.equal('ok');
  } catch (err) {
    throw new Error('create new discussion error.');
  }
  let discussionId = newDiscussionRes._id;
  try {
    let newDiscussionInfo = newDiscussionRes.body.discussion;
    newDiscussionInfo.id = newDiscussionInfo._id;
    newDiscussionInfo._id = ObjectID(newDiscussionInfo._id);
    await next(newDiscussionInfo);
  } catch (err) {
    await dbTool.discussion.removeOne({ _id: discussionId });
    throw err;
  }

  await dbTool.discussion.removeOne({ _id: discussionId });
  return;
};
exports.createOneDiscussion = createOneDiscussion;
