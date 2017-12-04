'use strict';

const { ObjectID } = require('mongodb');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');
const utils = require('../../utils');
const _ = require('lodash');
const { middleware } = utils;

const router = express.Router();

/**
 * [工具函数] 根据 messageId 获取详细消息
 * 由 beforeDate 向前取 pagesize 条 line
 *
 * @param {MongoID} _messageId 消息 id
 * @param {number} beforeDate 由此日期向前
 * @param {number} pagesize 获取的 line 数量
 * @returns {timeline}
 */
let getTimeLine = async (_messageId, beforeDate, pagesize) => {
  // 获取 timeline
  let timeline = await dbTool.message.aggregate([
    { $match: { _id: _messageId } },
    { $project: { timeline: 1, _id: 0 } },
    { $unwind: '$timeline' },
    { $match: { 'timeline.date': { $lt: beforeDate } } },
    { $sort: { 'timeline.date': -1 } },
    { $limit: pagesize }
  ]).toArray();
  timeline = timeline.map(message => message.timeline);
  return timeline;
};

/**
 * 发送一条消息给指定成员
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let sendMessage = async (req, res, next) => {
  // 检查用户是否存在
  let _recipientId = ObjectID(req.params.id);
  let recipientInfo = await dbTool.commonMember.findOne({ _id: _recipientId });
  if (!recipientInfo) return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);

  // 生成基础 message
  let members = [req.member._id, _recipientId];
  let updateRes = await dbTool.message.findOneAndUpdate(
    {
      $and: [
        { 'members.0': { $in: members } },
        { 'members.1': { $in: members } }
      ]
    }, {
      $setOnInsert: {
        members: [req.member._id, _recipientId]
      },
      $push: {
        timeline: utils.object.removeUndefined({
          content: req.body.content,
          from: req.member._id,
          date: Date.now()
        })
      }
    }, {
      returnOriginal: false,
      upsert: true // insert the document if it does not exist
    }
  );

  /* istanbul ignore if */
  if (updateRes.ok !== 1) {
    return errorHandler(null, errorMessages.SERVER_ERROR, 400, res);
  }

  return res.status(201).send({ status: 'ok', messageId: updateRes.value._id });
};

/**
 * 获取自己所有的消息摘要
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessagesInfo = async (req, res, next) => {
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;
  let messagesInfo = await dbTool.message.aggregate([
    {
      $match: {
        $or: [
          { 'members.0': req.member._id },
          { 'members.1': req.member._id }
        ]
      }
    },
    { $sort: { 'timeline.0.date': -1 } },
    { $project: { members: 1 } },
    { $limit: pagesize },
    { $skip: offset }
  ]).toArray();
  let count = await dbTool.message.count({
    $or: [
      { 'members.0': req.member._id },
      { 'members.1': req.member._id }
    ]
  });
  return res.status(200).send({ status: 'ok', messagesInfo: messagesInfo, count: count });
};

/**
 * 获取与指定成员的消息记录
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessageByMemberId = async (req, res, next) => {
  let { beforeDate, pagesize } = req.query;
  beforeDate = beforeDate || Date.now();
  let _id = ObjectID(req.params.id);
  let members = [req.member._id, _id];

  // 获取 message 摘要
  let messageInfo = await dbTool.message.aggregate([
    {
      $match: {
        $and: [
          { 'members.0': { $in: members } },
          { 'members.1': { $in: members } }
        ]
      }
    },
    { $project: { timeline: 0 } }
  ]).toArray();
  /* istanbul ignore if */
  if (messageInfo.length !== 1) {
    return errorHandler(new Error(`there is ${messageInfo.length} messages belongs to the same couple.`), errorMessages.SERVER_ERROR, 500, res);
  }
  messageInfo = messageInfo[0];

  let timeline = await getTimeLine(messageInfo._id, beforeDate, pagesize);
  let message = Object.assign({}, messageInfo, { timeline });

  return res.status(200).send({ status: 'ok', message: message });
};

/**
 * 获取指定 id 的消息记录
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessageById = async (req, res, next) => {
  let { beforeDate, pagesize } = req.query;
  beforeDate = beforeDate || Date.now();
  let _messageId = ObjectID(req.params.id);

  // 获取 message 摘要
  let messageInfo = await dbTool.message.aggregate([
    { $match: { _id: _messageId } },
    { $project: { timeline: 0 } }
  ]).toArray();
  if (messageInfo.length !== 1) {
    return errorHandler(new Error(`there is ${messageInfo.length} messages belongs to the same couple.`), errorMessages.SERVER_ERROR, 500, res);
  }
  messageInfo = messageInfo[0];

  let timeline = await getTimeLine(messageInfo._id, beforeDate, pagesize);
  let message = Object.assign({}, messageInfo, { timeline });

  return res.status(200).send({ status: 'ok', message: message });
};

router.post('/:id', middleware.verifyMember, validation(dataInterface.message.sendMessage), sendMessage);
router.get('/member/:id', middleware.verifyMember, validation(dataInterface.message.getMessageByMemberId), getMessageByMemberId);
router.get('/:id', middleware.verifyMember, validation(dataInterface.message.getMessageById), getMessageById);
router.get('/', middleware.verifyMember, validation(dataInterface.message.getMessagesInfo), getMessagesInfo);

module.exports = router;
