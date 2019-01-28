'use strict';

const jwt = require('jsonwebtoken');
const { ObjectID } = require('mongodb');

const config = require('../../../config');
const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

let sudo = async (req, res, next) => {
  try {
    // let _id = req.query.id ? ObjectID(req.query.id) : req.member._id;
    let _id = req.member._id;

    let memberInfo = await dbTool.commonMember.findOne({ _id: _id });
    if (!memberInfo) return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 404, res);
    await utils.member.removePrivateField(memberInfo, req.member.permissions);
    memberInfo.role = 'admin';

    // 插入 memberToken 作为身份识别码。
    let memberToken = jwt.sign({ id: memberInfo._id.toString(), sudo: true }, config.jwtSecret);
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

module.exports = {
  isAdmin,
  sendNotification,
  sudo,
};
