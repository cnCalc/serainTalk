'use strict';

const assert = require('assert');
const dbTool = require('../../database');
const testTools = require('./');
const { ObjectID } = require('mongodb');
const config = require('../../config');
const _ = require('lodash');

exports = module.exports = {};

let discussionFakeInfo = {
  title: 'test title',
  tags: ['testtag'],
  category: '函数机综合讨论区',
  content: {
    encoding: 'html',
    content: 'test text',
  },
};
exports.discussionFakeInfo = discussionFakeInfo;
/**
 * [工具] 校验两个讨论是否完全相同
 *
 * @param {Discussion} a 获取到的完整对象
 * @param {Discussion} b 想要校验的字段
 * @returns {boolean}
 */
let isSameDiscussion = (a, b) => {
  return !!_.find([a], b);
};
exports.isSameDiscussion = isSameDiscussion;

/**
 * [工具] 快速新建讨论。
 * 后续操作完成后会将该讨论销毁。
 *
 * @param {any} agent 传入 superTest 的 agent 以传递 Token
 * @param {any} [tempDiscussionInfo=testTools.testObject.discussionInfo] 按指定讨论信息新建讨论。null 则以默认模板创建。
 * @param {Promise} next 新建完成后需要执行的操作函数。会将新讨论的信息作为参数传入。
 * @returns
 */
let createOneDiscussion = async (agent, discussionInfo, next) => {
  await dbTool.prepare();
  let tempDiscussionInfo = JSON.parse(JSON.stringify(testTools.testObject.discussionInfo));
  if (discussionInfo) _.merge(tempDiscussionInfo, discussionInfo);

  let url = '/api/v1/discussion';

  let newDiscussionRes = await agent
    .post(url)
    .send(tempDiscussionInfo);
  try {
    if (newDiscussionRes.body.status === 'error') {
      const error = new Error(newDiscussionRes.body.message);
      error.code = newDiscussionRes.body.code;
      throw error;
    }
    assert(newDiscussionRes.statusCode === 201);
    assert(newDiscussionRes.body.status === 'ok');
  } catch (err) {
    throw err;
  }
  let discussionId = newDiscussionRes.body.discussion._id;
  let _discussionId = ObjectID(discussionId);
  try {
    let newDiscussionInfo = newDiscussionRes.body.discussion;
    newDiscussionInfo.id = newDiscussionInfo._id;
    newDiscussionInfo._id = ObjectID(newDiscussionInfo._id);
    await next(newDiscussionInfo);
  } catch (err) {
    await dbTool.discussion.removeOne({ _id: _discussionId });
    throw err;
  }

  await dbTool.discussion.removeOne({ _id: _discussionId });
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
  await config.prepare();

  let tempLimit = config.discussion.freqLimit;
  config.discussion.freqLimit = 0;

  await next();

  config.discussion.freqLimit = tempLimit;
};
exports.closeFreqLimit = closeFreqLimit;

let setWhiteList = async (whiteList, next) => {
  let tempList = config.discussion.category.whiteList;
  if (Array.isArray(whiteList)) config.discussion.category.whiteList = whiteList;
  else config.discussion.category.whiteList = [];

  await next();

  config.discussion.category.whiteList = tempList;
};
exports.setWhiteList = setWhiteList;
