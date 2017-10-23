'use strict';

const { ObjectID } = require('mongodb');
const config = require('../../config');
const { resloveMembersInDiscussionArray, resloveMembersInDiscussion } = require('../../utils/resolve-members');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');
const { middleware } = require('../../utils');

const router = express.Router();

/**
 * 获取最新的讨论
 * /api/v1/discussions/latest
 * query : [tag][memberid][page][pagesize]
 * 当没有参数时，查询整站的讨论
 * 按照最新回复排序
 * @param {Request} req
 * @param {Response} res
 */
async function getLatestDiscussionList (req, res) {
  let query = {};

  if (req.query.tag) {
    // 非管理只显示白名单中的标签
    if (req.member.role !== 'admin') {
      req.query.tag = req.query.tag.filter(
        item => config.discussion.category.whiteList.includes(item)
      );
    }
    query.tags = {
      $in: req.query.tag
    };
  }
  if (req.query.memberid) {
    req.query.memberid = ObjectID(req.query.memberid);
    query.creater = { $eq: req.query.memberid };
  }
  let pagesize = req.query.pagesize || config.pagesize;
  let offset = req.query.page - 1 || 0;

  try {
    let results = await dbTool.discussion.find(
      query,
      {
        creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1,
        tags: 1, status: 1, lastMember: 1, replies: 1, category: 1
      },
      {
        limit: pagesize,
        skip: offset * pagesize,
        sort: [['lastDate', 'desc']]
      }
    ).toArray();
    resloveMembersInDiscussionArray(results, (err, members) => {
      if (err) {
        /* istanbul ignore next */
        return errorHandler(err, errorMessages.DB_ERROR, 500, res);
      }
      return res.send({ status: 'ok', discussions: results, members });
    });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
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
    {
      $project: {
        creater: 1, title: 1, createDate: 1,
        lastDate: 1, views: 1, tags: 1,
        status: 1, lastMember: 1, category: 1,
        postsCount: { $size: '$posts' },
      }
    }
  ]).toArray((err, results) => {
    if (err) {
      /* istanbul ignore next */
      return errorHandler(err, errorMessages.DB_ERROR, 500, res);
    }

    if (results.length === 0) {
      return errorHandler(err, errorMessages.NOT_FOUND, 404, res);
    }

    let result = Object.assign({ status: 'ok' }, results[0]);
    res.send(result);
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
          /* istanbul ignore next */
          return errorHandler(err, errorMessages.DB_ERROR, 500, res);
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

/**
 * [处理函数] 创建新讨论
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let createDiscussion = async (req, res, next) => {
  let now = Date.now();
  let discussionInfo = {
    creater: req.member._id,
    title: req.body.title,
    createDate: now,
    lastDate: now,
    lastMember: req.member._id,
    views: 0,
    replies: 1,
    tags: req.body.tags,
    category: req.body.category,
    participants: [
      req.member._id
    ],
    posts: [
      {
        user: req.member._id,
        createDate: now,
        encoding: req.body.content.encoding,
        content: req.body.content.content,
        allowScript: false,
        votes: []
      },
    ]
  };
  try {
    await dbTool.discussion.insertOne(discussionInfo);
    return res.status(201).send({ status: 'ok', discussion: discussionInfo });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let createPost = async (req, res, next) => {
  let postInfo = {
    user: req.member._id,
    createDate: Date.now(),
    encoding: req.body.encoding,
    content: req.body.content,
    allowScript: false,
    votes: [],
    status: null
  };

  // 追加一个 Post
  try {
    await dbTool.discussion.updateOne(
      { _id: ObjectID(req.params.id) },
      { $push: { posts: postInfo }}
    );
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }

  return res.status(201).send({ status: 'ok', newPost: postInfo });
};

router.get('/latest', validation(dataInterface.discussion.getLatestList), getLatestDiscussionList);
router.get('/:id/posts', getDiscussionPostsById);
router.get('/:id', getDiscussionById);
router.post('/:id/post', middleware.verifyMember, middleware.checkCommitFreq, validation(dataInterface.discussion.createPost), createPost);
router.post('/', middleware.verifyMember, middleware.checkCommitFreq, validation(dataInterface.discussion.createDiscussion), createDiscussion);

module.exports = router;
