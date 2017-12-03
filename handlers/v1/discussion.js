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
const utils = require('../../utils');
const { middleware } = utils;
const _ = require('lodash');

const router = express.Router();

/**
 * 获取最新的讨论
 * /api/v1/discussions/latest
 * query : [tag][memberId][page][pagesize]
 * 当没有参数时，查询整站的讨论
 * 按照最新回复排序
 * @param {Request} req
 * @param {Response} res
 */
async function getLatestDiscussionList (req, res) {
  let query = {};

  if (req.query.category) {
    // 非管理只显示白名单中的标签
    if (req.member.role !== 'admin') {
      req.query.category = req.query.category.filter(
        item => config.discussion.category.whiteList.includes(item)
      );
    }
    query.category = { $in: req.query.category };
  }
  if (req.query.memberId) {
    req.query.memberId = ObjectID(req.query.memberId);
    query.creater = { $eq: req.query.memberId };
  }
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;
  if (req.query.tag) query.tags = { $in: req.query.tag };

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
    let members = await resloveMembersInDiscussionArray(results);
    return res.send({ status: 'ok', discussions: results, members });
  } catch (err) {
    /* istanbul ignore next */
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
    /* istanbul ignore next */
    return errorHandler(err, 'invalid discussion id', 400, res);
  }

  dbTool.db.collection('discussion').aggregate([
    { $match: { _id: discussionId } },
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
    return res.status(200).send(result);
  });
}

/**
 * 根据 ID 获得指定讨论的帖子
 * /api/v1/discussion/:id/posts
 * @param {Request} req
 * @param {Response} res
 */
async function getDiscussionPostsById (req, res) {
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;
  let discussionId;
  try {
    discussionId = ObjectID(req.params.id);
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, 'invalid discussion id', 400, res);
  }
  try {
    let results = await dbTool.db.collection('discussion').aggregate([
      { $match: { _id: discussionId } },
      { $project: { title: 1, posts: { $slice: ['$posts', offset * pagesize, pagesize] } } }
    ]).toArray();
    if (results.length === 0) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }
    let members = await resloveMembersInDiscussion(results[0]);
    return res.status(200).send({
      status: 'ok',
      posts: utils.renderer.renderPosts(results[0].posts),
      members
    });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
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
        encoding: req.body.content.encoding,  // TODO: 这里需要检查一下用户所在组，管理员以上才可以指定 encoding，否则只可以为 markdown。
        content: req.body.content.content,
        allowScript: false,                   // TODO: 同上
        index: 1,
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
  let _id = ObjectID(req.params.id);
  let now = Date.now();

  let postInfo = {
    user: req.member._id,
    createDate: now,
    content: req.body.content,
    encoding: req.member.role === 'admin' ? req.body.encoding : 'markdown',
    allowScript: req.member.role === 'admin',
    votes: [],
    status: null,
  };
  if (req.body.replyTo) {
    postInfo.replyTo = req.body.replyTo;
    postInfo.replyTo.memberId = ObjectID(postInfo.replyTo.memberId);
  }

  // 追加一个 Post，同时更新一些元数据
  try {
    await dbTool.discussion.updateOne(
      { _id: _id },
      {
        $push: { posts: postInfo },
        $inc: { replies: 1 },
        $set: {
          lastMember: req.member._id,
          lastDate: new Date().getTime()
        }
      }
    );

    // 动态生成楼层号
    let discussionInfo = await dbTool.discussion.findOne({
      _id: _id
    });
    let postList = discussionInfo.posts;
    for (let i = postList.length - 1; i >= 0; i--) {
      if (postList[i].index === undefined) {
        let updateInfo = { $set: {} };
        updateInfo.$set[`posts.${i}.index`] = i + 1;
        await dbTool.discussion.update(
          { _id: _id },
          updateInfo
        );

        // 为返回结果添上楼层号
        // 筛选添加的楼层
        if (postList[i].createDate === now && postList[i].user.toString() === req.member._id.toString()) {
          postInfo.index = i + 1;
        }
      } else break;
    }

    return res.status(201).send({ status: 'ok', newPost: postInfo });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let votePost = async (req, res, next) => {
  try {
    let _discussionId = ObjectID(req.params.id);
    // 检索 post 是否存在
    let postInfo = await dbTool.discussion.aggregate([
      { $match: { _id: _discussionId } },
      { $unwind: '$posts' },
      { $match: { 'posts.index': req.params.postIndex } },
      { $project: { posts: 1 } }
    ]).toArray();
    if (postInfo.length === 0) return errorHandler(null, errorMessages.NOT_FOUND, 404, res);

    // 移除所有之前的已提交
    let removeVoteInfo = { $pull: {} };
    removeVoteInfo.$pull[`posts.${req.params.postIndex - 1}.votes.${req.body.vote}`] = req.member._id;
    let removeDoc = await dbTool.discussion.updateOne(
      { _id: _discussionId },
      removeVoteInfo
    );
    // 如果之前存在提交，已抹除成功。
    if (removeDoc.modifiedCount === 1) return res.status(201).send({ status: 'ok' });

    // 新增 vote
    let addVoteInfo = { $push: {} };
    addVoteInfo.$push[`posts.${req.params.postIndex - 1}.votes.${req.body.vote}`] = req.member._id;
    await dbTool.discussion.updateOne(
      { _id: _discussionId },
      addVoteInfo
    );
    return res.status(201).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

router.get('/latest', validation(dataInterface.discussion.getLatestList), getLatestDiscussionList);
router.get('/:id/posts', getDiscussionPostsById);
router.get('/:id', validation(dataInterface.discussion.getDiscussion), getDiscussionById);
router.post('/:id/post/:postIndex/vote', middleware.verifyMember, validation(dataInterface.discussion.votePost), votePost);
router.post('/:id/post', middleware.verifyMember, middleware.checkCommitFreq, validation(dataInterface.discussion.createPost), createPost);
router.post('/', middleware.verifyMember, middleware.checkCommitFreq, validation(dataInterface.discussion.createDiscussion), createDiscussion);

module.exports = router;
