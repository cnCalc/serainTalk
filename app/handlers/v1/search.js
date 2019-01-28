'use strict';

const dbTool = require('../../../database');
const config = require('../../../config');
const utils = require('../../../utils');
const jieba = require('nodejieba');
const { errorHandler, errorMessages } = utils;

/*
db.discussion.aggregate([
  { $unwind: '$posts' },
  { $match: { 'posts.content': { $regex : /9750/i } } },
  { $match: { 'posts.content': { $regex : /自然书写/i } } },
  { $project: { title: 1, post: '$posts.content', date: '$posts.createDate' } },
  { $sort: { date: -1 } },
  { $limit: 10 }
]).pretty();
*/

function escapeRegExp (string) {
  return (string || '').replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&');
}

// TODO: 限制隐藏/封禁的帖子
// TODO: 限制搜索分区
const searchPostContent = async (req, res) => {
  try {
    let aggregates = [];

    // 鉴权 能否读取白名单分类中的讨论
    if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }

    // 鉴权 能否读取所有分类
    if (!await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      aggregates.push({
        $match: {
          category: { $in: config.discussion.category.whiteList },
          $or: [
            { status: null },
            { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
          ],
        },
      });
    }

    aggregates.push({ $unwind: '$posts' });

    // 鉴权 能否读取被封禁的 post
    if (!await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
      aggregates.push({
        $match: {
          $or: [
            { 'posts.status': null },
            { 'posts.status.type': { $in: [config.discussion.status.ok] } },
            { 'posts.user': req.member._id }, // 允许看到自己被删除的帖子
          ],
        },
      });
    }

    aggregates.push({ $project: { _discussionId: '$_id', title: 1, post: '$posts.content', date: '$posts.createDate', index: '$posts.index' } });
    aggregates = aggregates.concat(req.query.keywords.split(' ').map(keyword => {
      return { $match: { 'post': { $regex: new RegExp(escapeRegExp(keyword), 'i') } } };
    }));
    aggregates = aggregates.concat([
      { $sort: { date: -1 } },
      { $limit: 10 },
    ]);
    const result = await dbTool.discussion.aggregate(aggregates).toArray();

    res.status(200).send({
      status: 'ok',
      result,
    });
  } catch (e) {
    errorHandler(e, errorMessages.SERVER_ERROR, 500, res);
  }
};

// TODO: 限制搜索分区
const searchDiscussionTitle = async (req, res) => {
  const keywords = jieba.extract(req.query.keywords, 10).map(r => r.word);
  try {
    let aggregates = [];
    // 鉴权 能否读取白名单分类中的讨论
    if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }

    // 鉴权 能否读取所有分类
    if (!await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      aggregates.push({
        $match: {
          category: { $in: config.discussion.category.whiteList },
          $or: [
            { status: null },
            { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
          ],
        },
      });
    }
    aggregates = aggregates.concat(keywords.map(keyword => {
      return { $match: { 'title': { $regex: new RegExp(escapeRegExp(keyword), 'i') } } };
    }));
    aggregates = aggregates.concat([
      {
        $match: {
          $or: [
            { status: null },
            { 'status.type': 'ok' },
          ],
        },
      },
      { $project: { title: 1, category: 1, postsCount: { $size: '$posts' } } },
      { $sort: { postsCount: -1 } },
      { $limit: 10 },
    ]);
    const result = await dbTool.discussion.aggregate(aggregates).toArray();

    res.status(200).send({
      status: 'ok',
      result,
    });
  } catch (e) {
    errorHandler(e, errorMessages.SERVER_ERROR, 500, res);
  }
};

const searchMembers = async (req, res) => {
  const members = await dbTool.commonMember.find({
    username: new RegExp(escapeRegExp(req.query.keywords), 'i'),
  }, {
    limit: 10,
  }).toArray();

  res.send({
    status: 'ok',
    result: members,
  });
};

module.exports = {
  searchPostContent,
  searchDiscussionTitle,
  searchMembers,
};
