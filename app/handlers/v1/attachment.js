'use strict';

const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

/**
 * 根据指定的 Attachment ID 获得指定附件的详细信息（兼容 Discuz）
 *
 * @param {Request} req
 * @param {Response} res
 */
let getAttachmentByAttachmentId = async (req, res) => {
  let attachmentId = req.query.aid;
  try {
    let attachmentInfo = await dbTool.attachment.findOne({ aid: attachmentId });
    return res.status(200).send({ status: 'ok', attachment: attachmentInfo });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  };
};

/**
 * 获取指定 memberId 所上传的附件列表
 *
 * @param {Request} req
 * @param {Response} res
 */
let getAttachmentByMemberId = async (req, res) => {
  try {
    let attachmentInfos = await dbTool.commonMember.aggregate([
      { $match: { _id: req.member._id } },
      { $project: { attachment: true } },
    ]).toArray();
    attachmentInfos = attachmentInfos[0].attachment;
    return res.status(200).send({ status: 'ok', attachments: attachmentInfos });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  };
};

/**
 * 上传一个附件
 *
 * @param {Request} req
 * @param {Response} res
 */
let uploadAttachment = async (req, res, next) => {
  try {
    await dbTool.commonMember.updateOne(
      { _id: req.member._id },
      {
        $push: {
          attachment: {
            originalName: req.file.originalname,
            fileName: req.file.filename,
            size: req.file.size,
            referer: [],
          },
        },
      }
    );
    return res.status(201).send({ status: 'ok', attachmentName: req.file.filename });
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
  };
};

module.exports = {
  getAttachmentByAttachmentId,
  uploadAttachment,
  getAttachmentByMemberId,
};
