'use strict';

const { ObjectID } = require('mongodb');
const config = require('../../config');
const { resloveMembersInDiscussionArray, resloveMembersInDiscussion } = require('../../utils/resolve-members');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const router = express.Router();

/**
 * 获取指定标签下最新的讨论
 * /api/v1/discussions/latest?tag=1&tag=2&page=1&pagesize=10
 * 当没有标签时，查询整站的讨论
 * 按照最新回复排序
 * @param {Request} req
 * @param {Response} res
 */
function getLatestDiscussionList (req, res) {
  let query = {};
  if (req.query.tag) {
    query = {
      tags: { $in: (req.query.tag instanceof Array) ? req.query.tag : [req.query.tag] }
    };
  }
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;

  dbTool.db.collection('discussion').find(query, {
    creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, lastMember: 1, replies: 1, category: 1
  }, {
    limit: pagesize,
    skip: offset * pagesize,
    sort: [['lastDate', 'desc']]
  }).toArray((err, results) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
      return;
    } else {
      resloveMembersInDiscussionArray(results, (err, members) => {
        if (err) {
          errorHandler(err, errorMessages.DB_ERROR, 500, res);
          return;
        }
        res.send({
          status: 'ok',
          discussions: results,
          members
        });
      });
    }
  });
}

/**
 * 根据 ID 获得指定讨论的信息，不包含帖子列表
 * /api/v1/discussion/:id
 * @param {Request} req
 * @param {Response} res
 */
function getDiscussionById (req, res) {
  let discussionId;
  try {
    discussionId = ObjectID(req.params.id);
  } catch (err) {
    errorHandler(err, 'invalid discussion id', 400, res);
    return;
  }

  dbTool.db.collection('discussion').aggregate([
    { $match: { _id: discussionId }},
    { $project: {
      creater: 1, title: 1, createDate: 1,
      lastDate: 1, views: 1, tags: 1,
      status: 1, lastMember: 1, category: 1,
      postsCount: { $size: '$posts' },
    }}
  ]).toArray((err, results) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
    } else if (results.length === 0) {
      errorHandler(err, errorMessages.NOT_FOUND, 404, res);
    } else {
      let result = Object.assign({ status: 'ok' }, results[0]);
      res.send(result);
    }
  });
}

/**
 * 根据 ID 获得指定讨论的帖子
 * /api/v1/discussion/:id/posts
 * @param {Request} req
 * @param {Response} res
 */
function getDiscussionPostsById (req, res) {
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;
  let discussionId;
  try {
    discussionId = ObjectID(req.params.id);
  } catch (err) {
    errorHandler(err, 'invalid discussion id', 400, res);
    return;
  }
  dbTool.db.collection('discussion').aggregate([
    { $match: { _id: discussionId }},
    { $project: { title: 1, posts: { $slice: ['$posts', offset * pagesize, pagesize] }}}
  ]).toArray((err, results) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
    } else if (results.length === 0) {
      errorHandler(err, errorMessages.NOT_FOUND, 404, res);
    } else {
      resloveMembersInDiscussion(results[0], (err, members) => {
        if (err) {
          errorHandler(err, errorMessages.DB_ERROR, 500, res);
          return;
        }
        res.send({
          status: 'ok',
          posts: results[0].posts,
          members
        });
      });
    }
  });
}

router.get('/latest', getLatestDiscussionList);
router.get('/:id', getDiscussionById);
router.get('/:id/posts', getDiscussionPostsById);


module.exports = router;
