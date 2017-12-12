'use strict';

const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');

const config = require('../../../config');
const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

let sudo = async (req, res, next) => {
  try {
    let _id = req.query.id ? ObjectID(req.query.id) : req.member._id;

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
  await utils.notification.sendNotification(_id, req.query);
  return res.status(201).send({ status: 'ok' });
};

let isAdmin = async (req, res, next) => {
  return res.status(200).send({ status: 'ok', isAdmin: req.member.role === 'admin' });
};

// router.get('/sudo', validation(dataInterface.debug.sudo), sudo);
// router.get('/notification/:id', validation(dataInterface.debug.sendNotification), sendNotification);
// router.get('/isadmin', isAdmin);

module.exports = {
  sudo,
  sendNotification,
  isAdmin
};
