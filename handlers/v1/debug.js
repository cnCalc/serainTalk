'use strict';

const { ObjectID } = require('mongodb');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const utils = require('../../utils');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');

let router = express.Router();

let sudo = async (req, res, next) => {
  try {
    let _id = req.params.id ? ObjectID(req.params.id) : req.member._id;

    let memberInfo = await dbTool.commonMember.findOne({ _id: _id });
    if (!memberInfo) return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
    utils.member.removePrivateField(memberInfo);
    memberInfo.role = 'admin';

    // 插入 memberToken 作为身份识别码。
    let memberToken = jwt.sign(memberInfo, config.jwtSecret);
    res.cookie('membertoken', memberToken, { maxAge: config.cookie.renewTime });
    return res.status(201).send({ status: 'ok', memberinfo: memberInfo });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let sendNotification = async (req, res, next) => {
  let _id = ObjectID(req.params.id);
  await utils.notification.sendNotification(_id, req.body);
  return res.status(201).send({ status: 'ok' });
};

router.post('/sudo', validation(dataInterface.debug.sudo), sudo);
router.post('/notification/:id', validation(dataInterface.debug.sendNotification), sendNotification);

module.exports = router;
