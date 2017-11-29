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
 * 根据 id 获取详细消息
 *
 * @param {MongoID} _messageId
 */
let getTimeLine = async (_messageId, page, pagesize) => {
  // 获取 timeline
  let timeline = await dbTool.message.aggregate([
    { $match: { _id: _messageId } },
    { $project: { timeline: 1, _id: 0 } },
    { $unwind: '$timeline' },
    { $sort: { 'timeline.date': -1 } },
    { $skip: page * pagesize },
    { $limit: pagesize }
  ]).toArray();
  timeline = timeline.map(message => message.timeline);

  // 获取计数
  let count = await dbTool.message.aggregate([
    { $match: { _id: _messageId } },
    { $project: { timeline: 1, _id: 0 } },
    { $unwind: '$timeline' },
    { $count: 'count' }
  ]).toArray();
  count = count[0].count;

  return { timeline, count };
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
  let participates = [req.member._id, _recipientId];
  let updateRes = await dbTool.message.findOneAndUpdate(
    {
      $and: [
        { 'participates.0': { $in: participates } },
        { 'participates.1': { $in: participates } }
      ]
    }, {
      $setOnInsert: {
        participates: [req.member._id, _recipientId],
        participatesInfo: [
          {
            _id: req.member._id,
            username: req.member.username,
            avatar: req.member.avatar
          }, {
            _id: recipientInfo._id,
            username: recipientInfo.username,
            avatar: recipientInfo.avatar
          }
        ]
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
  return res.status(201).send({ status: 'ok', newMessage: _.last(updateRes.value.timeline) });
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
          { 'participates.0': req.member._id },
          { 'participates.1': req.member._id }
        ]
      }
    },
    { $sort: { 'timeline.0.date': -1 } },
    { $project: { participatesInfo: 1 } },
    { $limit: pagesize },
    { $skip: offset }
  ]).toArray();
  let count = await dbTool.message.count({
    $or: [
      { 'participates.0': req.member._id },
      { 'participates.1': req.member._id }
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
  let { page, pagesize } = req.query;
  page -= 1;
  let _id = ObjectID(req.params.id);
  let participates = [req.member._id, _id];

  // 获取 message 摘要
  let messageInfo = await dbTool.message.aggregate([
    {
      $match: {
        $and: [
          { 'participates.0': { $in: participates } },
          { 'participates.1': { $in: participates } }
        ]
      }
    },
    { $project: { timeline: 0 } }
  ]).toArray();
  if (messageInfo.length !== 1) {
    return errorHandler(new Error(`there is ${messageInfo.length} messages belongs to the same couple.`), errorMessages.SERVER_ERROR, 500, res);
  }
  messageInfo = messageInfo[0];

  let { timeline, count } = await getTimeLine(messageInfo._id, page, pagesize);
  let message = Object.assign({}, messageInfo, { timeline });

  return res.status(200).send({ status: 'ok', message: message, count: count });
};

/**
 * 获取指定 id 的消息记录
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessageById = async (req, res, next) => {
  let { page, pagesize } = req.query;
  page -= 1;
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

  let { timeline, count } = await getTimeLine(messageInfo._id, page, pagesize);
  let message = Object.assign({}, messageInfo, { timeline });

  return res.status(200).send({ status: 'ok', message: message, count: count });
};

router.post('/:id', middleware.verifyMember, validation(dataInterface.message.sendMessage), sendMessage);
router.get('/member/:id', middleware.verifyMember, validation(dataInterface.message.getMessageByMemberId), getMessageByMemberId);
router.get('/:id', middleware.verifyMember, validation(dataInterface.message.getMessageById), getMessageById);
router.get('/', middleware.verifyMember, validation(dataInterface.message.getMessagesInfo), getMessagesInfo);

module.exports = router;
