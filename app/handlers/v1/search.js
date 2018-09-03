'use strict';

const dbTool = require('../../../database');
const utils = require('../../../utils');
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

const searchPostContent = async (req, res) => {
  try {
    const aggregates = [
      { $unwind: '$posts' },
      ...req.query.keywords.split(' ').map(keyword => {
        return { $match: { 'posts.content': { $regex: new RegExp(escapeRegExp(keyword)) } } };
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

module.exports = {
  searchPostContent,
};
