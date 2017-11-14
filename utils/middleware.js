'use strict';

const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const config = require('./../config');
const errorHandler = require('./error-handler');
const errorMessages = require('./error-messages');
const dbTool = require('../utils/database');

exports = module.exports = {};

/**
 * [中间件]获取成员信息
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let getMemberInfo = (req, res, next) => {
  req.member = {};
  if (req.cookies && req.cookies.membertoken) {
    try {
      req.member = jwt.verify(req.cookies.membertoken, config.jwtSecret);
      req.member.id = req.member._id;
      req.member._id = ObjectID(req.member.id);
    } catch (err) {
      req.member = {};
    }
  }
  return next();
};
exports.getMemberInfo = getMemberInfo;
/**
 * [中间件]整理参数
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let prepareData = (req, res, next) => {
  req.data = Object.assign({}, req.params, req.body, req.query);
  return next();
};
exports.prepareData = prepareData;

/**
 * [中间件]对支持的浏览器禁用缓存
 *
 * @param {any} req 请求
 * @param {any} res 回复
 * @param {any} next 传递给下一中间件
 */
let disableCache = (req, res, next) => {
  res.header('cache-control', 'no-cache');
  res.header('pragma', 'no-cache');
  res.header('expires', '0');
  return next();
};
exports.disableCache = disableCache;

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
let checkDiscussionFreq = async (req, res, next) => {
  // 管理员无限制
  if (req.member.role === 'admin') return next();

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestDiscussion = await dbTool.discussion.aggregate([
    { $match: { 'creater': req.member._id }},
    { $sort: { 'createDate': -1 }},
    { $limit: 1 }
  ]).toArray();
  if (latestDiscussion.length === 0) return next();
  if (Date.now() - latestDiscussion[0].createDate <= config.discussion.freqLimit) {
    return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
  }
  return next();
};
exports.checkDiscussionFreq = checkDiscussionFreq;

/**
 * [中间件] 检查发布 Post 的频率
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let checkPostFreq = async (req, res, next) => {
  // 管理员无限制
  if (req.member.role === 'admin') return next();

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestPost = await dbTool.discussion.aggregate([
    { $match: { 'participants': req.member._id }},
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
                { $ne: ['$$post.createDate', '$createDate'] }
              ]
            }
          }
        }
      }
    },
    { $unwind: '$posts' },
    { $sort: { 'posts.createDate': -1 }},
    { $limit: 1 }
  ]).toArray();
  if (latestPost.length === 0) return next();
  if (Date.now() - latestPost[0].posts.createDate <= config.discussion.freqLimit) {
    return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
  }
  return next();
};
exports.checkPostFreq = checkPostFreq;

/**
 * [中间件] 检查所有的提交频率
 * 包括发布 Discussion 和发布 Post 的提交频率
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let checkCommitFreq = async (req, res, next) => {
  // 管理员无限制
  if (req.member.role === 'admin') return next();

  // 没登录没法查频率
  if (!req.member._id) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let latestPost = await dbTool.discussion.aggregate([
    { $match: { 'participants': req.member._id }},
    {
      $project: {
        posts: {
          $filter: {
            input: '$posts',
            as: 'post',
            // 因为发布 Discussion 的同时会发布一份 Post
            // 所以只需要统计 post 的频率
            cond: { $eq: ['$$post.user', req.member._id] }
          }
        }
      }
    },
    { $unwind: '$posts' },
    { $sort: { 'posts.createDate': -1 }},
    { $limit: 1 }
  ]).toArray();
  if (latestPost.length === 0) return next();
  if (Date.now() - latestPost[0].posts.createDate <= config.discussion.freqLimit) {
    return errorHandler(null, errorMessages.TOO_FREQUENT, 403, res);
  }
  return next();
};
exports.checkCommitFreq = checkCommitFreq;
