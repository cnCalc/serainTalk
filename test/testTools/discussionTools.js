'use strict';

const expect = require('chai').expect;
const dbTool = require('../../utils/database');
const testTools = require('./');
const { ObjectID } = require('mongodb');
const config = require('../../config');

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
 * @param {any} agent 传入 superTest 的 agent 以传递 Token
 * @param {Promise} next 新建完成后需要执行的操作函数。会将新讨论的信息作为参数传入。
 * @param {any} [discussionInfo=testTools.testObject.discussionInfo] 选填，按指定讨论信息新建讨论。会更新默认讨论的信息。
 * @returns
 */
let createOneDiscussion = async (agent, next, discussionInfo = testTools.testObject.discussionInfo) => {
  await dbTool.prepare();

  let url = '/api/v1/discussion';

  let newDiscussionRes = await agent
    .post(url)
    .send(discussionInfo);
  try {
    if (newDiscussionRes.body.status === 'error') {
      throw new Error(newDiscussionRes.body.message);
    }
    expect(newDiscussionRes.statusCode).to.be.equal(201);
    expect(newDiscussionRes.body.status).to.equal('ok');
  } catch (err) {
    throw err;
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
};
exports.createOneDiscussion = createOneDiscussion;

/**
 * [工具] 暂时关闭发布频率限制。
 * 后续操作完成后将重新开启。
 *
 * @param {Promise} next 后续操作函数（需为 Promise）。
 * @returns
 */
let closeFreqLimit = async (next) => {
  let tempLimit = config.discussion.freqLimit;
  config.discussion.freqLimit = 0;

  await next();

  config.discussion.freqLimit = tempLimit;
};
exports.closeFreqLimit = closeFreqLimit;
