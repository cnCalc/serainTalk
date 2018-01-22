'use strict';

const express = require('express');
const validation = require('express-validation');

const dbTool = require('../../../database');
const dataInterface = require('../../dataInterface');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

const router = express.Router();

/**
 * 根据指定的 Attachment ID 获得指定附件的详细信息（兼容 Discuz）
 * @param {Request} req
 * @param {Response} res
 */
let getAttachmentByAid = async (req, res) => {
  let attachmentId = req.query.aid;
  try {
    let attachmentInfo = await dbTool.attachment.findOne({ aid: attachmentId });
    return res.status(200).send({ status: 'ok', attachment: attachmentInfo });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  };
};

let uploadAttachment = async (req, res, next) => {
  return res.status(201).send({ status: 'ok', attachmentName: req.file.filename });
};

router.get('/', validation(dataInterface.attachment.getAttachment), getAttachmentByAid);

module.exports = {
  getAttachmentByAid,
  uploadAttachment,
};
