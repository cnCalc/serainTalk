'use strict';

const { ObjectID } = require('mongodb');
const config = require('../../config');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');
const utils = require('../../utils');
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
  let message = {
    date: Date.now(),
    from: {
      _id: req.member._id,
      username: req.member.username,
      avatar: req.member.avatar
    },
    message: req.body.message,
    href: req.body.href,
    unread: true
  };
  let updateRes = await dbTool.commonMember.updateOne(
    { _id: ObjectID(req.params.id) },
    { $push: { messages: utils.object.removeUndefined(message) } }
  );
  if (updateRes.modifiedCount !== 1) {
    /* istanbul ignore next */
    return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 400, res);
  }
  return res.status(201).send({ status: 'ok', newMessage: message });
};
/**
 * 获取自己的消息列表
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getMessage = async (req, res, next) => {
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;
  let cursor = dbTool.commonMember.find(
    { _id: req.member._id },
    { limit: config.pagesize }
  ).sort({ createDate: -1 }).limit(pagesize).skip(offset * pagesize);
  let messages = await cursor.toArray();
  let count = await cursor.count();
  return res.status(200).send({ status: 'ok', messages: messages, count: count });
};

router.post('/:id', middleware.verifyMember, validation(dataInterface.message.sendMessage), sendMessage);
router.get('/', middleware.verifyMember, validation(dataInterface.message.getMessage), getMessage);

module.exports = router;
