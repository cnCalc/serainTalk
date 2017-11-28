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
 * 获取自己的消息列表
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessages = async (req, res, next) => {
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;
  let messages = await dbTool.message.aggregate([
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
  return res.status(200).send({ status: 'ok', messages: messages, count: count });
};

router.post('/:id', middleware.verifyMember, validation(dataInterface.message.sendMessage), sendMessage);
router.get('/', middleware.verifyMember, validation(dataInterface.message.getMessage), getMessages);

module.exports = router;
