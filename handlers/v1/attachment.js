'use strict';

const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const router = express.Router();

/**
 * 根据指定的 Attachment ID 获得指定附件的详细信息（兼容 Discuz）
 * @param {Request} req
 * @param {Response} res
 */
function getAttachmentByAid (req, res) {
  let attachmentId = req.query.aid;
  if (typeof attachmentId === 'undefined') {
    errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
    return;
  }
  dbTool.db.collection('attachment').findOne({ aid: Number(attachmentId) }).then(doc => {
    res.send({
      status: 'ok',
      attachment: doc,
    });
  }).catch(err => {
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  });
}

router.get('/', getAttachmentByAid);

module.exports = router;
