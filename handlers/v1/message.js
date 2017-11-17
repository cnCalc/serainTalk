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

const router = express.Router();

let sendMessage = async (req, res, next) => {
  let message = {
    date: Date.now(),
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

router.post('/:id', validation(dataInterface.message.sendMessage), sendMessage);

module.exports = router;
