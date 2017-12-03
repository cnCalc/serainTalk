'use strict';

const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const validation = require('express-validation');
const dataInterface = require('../../dataInterface');
const express = require('express');

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
    return res.status(200).send({ status: 'ok', attachment: attachmentInfo, });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  };
};

router.get('/', validation(dataInterface.attachment.getAttachment), getAttachmentByAid);

module.exports = router;
