'use strict';

const dbTool = require('../../../database');
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
    const aggregates = [
      { $unwind: '$posts' },
      ...req.query.keywords.split(' ').map(keyword => {
        return { $match: { 'posts.content': { $regex: new RegExp(escapeRegExp(keyword), 'i') } } };
      }),
      { $project: { title: 1, post: '$posts.content', date: '$posts.createDate', index: '$posts.index' } },
      { $sort: { date: -1 } },
      { $limit: 10 },
    ];
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
    const aggregates = [
      ...keywords.map(keyword => {
        return { $match: { 'title': { $regex: new RegExp(escapeRegExp(keyword), 'i') } } };
      }),
      { $match: {
        $or: [
          { status: null },
          { 'status.type': 'ok' },
        ],
      } },
      { $project: { title: 1, category: 1, postsCount: { $size: '$posts' } } },
      { $sort: { postsCount: -1 } },
      { $limit: 10 },
    ];
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
