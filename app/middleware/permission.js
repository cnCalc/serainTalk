'use strict';

const config = require('../../config');
const dbTool = require('../../database');
const utils = require('../../utils');
const { errorHandler, errorMessages } = utils;

exports = module.exports = {};

/**
 * [中间件] 验证成员是否为管理员身份
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let verifyAdmin = (req, res, next) => {
  if (req.member.role === 'admin') return next();
  return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
};
exports.verifyAdmin = verifyAdmin;

/**
 * [中间件] 验证成员是否已登录
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let verifyMember = (req, res, next) => {
  if (req.member._id) return next();
  return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
};
exports.verifyMember = verifyMember;

/**
 * [中间件] 检查发布 Discussion 的频率
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let verifyDiscussionFreq = async (req, res, next) => {
  // 鉴权 是否可以超频发帖
  if (await utils.permission.checkPermission('discussion-postWithoutFreqLimit', req.member.permissions)) {
    return next();
  }

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestDiscussion = await dbTool.discussion.aggregate([
    { $match: { 'creater': req.member._id } },
    { $sort: { 'createDate': -1 } },
    { $limit: 1 },
  ]).toArray();
  if (latestDiscussion.length === 0) return next();
  if (Date.now() - latestDiscussion[0].createDate <= config.discussion.freqLimit) {
    return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
  }
  return next();
};
exports.verifyDiscussionFreq = verifyDiscussionFreq;

/**
 * [中间件] 检查发布 Post 的频率
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let verifyPostFreq = async (req, res, next) => {
  // 鉴权 是否可以超频发帖
  if (await utils.permission.checkPermission('discussion-postWithoutFreqLimit', req.member.permissions)) {
    return next();
  }

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestPost = await dbTool.discussion.aggregate([
    { $match: { 'participants': req.member._id } },
    {
      $project: {
        posts: {
          $filter: {
            input: '$posts',
            as: 'post',
            cond: {
              $and: [
                { $eq: ['$$post.user', req.member._id] },
                // 因为发布 Discussion 的同时会发布一份 Post
                // 所以只要 post 的创建时间与 Discussion 相同则是一楼
                // 即可剔除发布 Discussion 的干扰
                { $ne: ['$$post.createDate', '$createDate'] },
              ],
            },
          },
        },
      },
    },
    { $unwind: '$posts' },
    { $sort: { 'posts.createDate': -1 } },
    { $limit: 1 },
  ]).toArray();
  if (latestPost.length === 0) return next();
  if (Date.now() - latestPost[0].posts.createDate <= config.discussion.freqLimit) {
    return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
  }
  return next();
};
exports.verifyPostFreq = verifyPostFreq;

/**
 * [中间件] 检查所有的提交频率
 * 包括发布 Discussion 和发布 Post 的提交频率
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let verifyCommitFreq = async (req, res, next) => {
  // 鉴权 是否可以超频发帖
  if (await utils.permission.checkPermission('discussion-postWithoutFreqLimit', req.member.permissions)) {
    return next();
  }

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestPost = await dbTool.discussion.aggregate([
    { $match: { lastDate: { $gte: Date.now() - config.discussion.freqLimit } } },
    {
      $project: {
        posts: {
          $filter: {
            input: '$posts',
            as: 'post',
            cond: {
              $and: [
                { $eq: ['$$post.user', req.member._id] },
                { $gt: ['$$post.createDate', Date.now() - config.discussion.freqLimit] },
              ],
            },
          },
        },
      },
    },
  ]).toArray();
  for (let discussion of latestPost) {
    if (discussion.posts.length !== 0) {
      return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
    }
  }
  return next();
};
exports.verifyCommitFreq = verifyCommitFreq;
