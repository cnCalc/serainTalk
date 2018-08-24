'use strict';

const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');

const dbTool = require('../../../database');
const config = require('../../../config');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

/**
 * 根据指定的 Attachment ID 获得指定附件的详细信息（兼容 Discuz）
 *
 * @param {Request} req
 * @param {Response} res
 */
let getAttachmentInfoByAttachmentId = async (req, res) => {
  try {
    let attachmentInfo;
    if (req.query.aid) {
      attachmentInfo = await dbTool.attachment.findOne({ aid: req.query.aid });
    }
    if (req.params.id) {
      let _attachmentId = ObjectID(req.params.id);
      attachmentInfo = await dbTool.attachment.findOne({ _id: _attachmentId });
    }

    if (attachmentInfo) {
      delete attachmentInfo.filePath;
      return res.status(200).send({ status: 'ok', attachment: attachmentInfo });
    }

    return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
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
let getAttachmentsInfoByMemberId = async (req, res) => {
  const query = { _owner: req.member._id };

  if (req.query.excludingUsed) {
    query.referer = [];
  }

  try {
    let attachmentInfos = await dbTool.attachment.aggregate([
      { $match: query },
      { $sort: { date: -1 } },
      { $project: { filePath: false } },
    ]).toArray();
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
    if (!req.file) {
      return errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
    }

    let attachmentInfo = await dbTool.attachment.aggregate([
      { $match: { _owner: req.member._id, type: 'file' } },
      { $project: { filePath: false } },
      { $count: 'count' },
    ]).toArray();

    // 检测是否超过上传限制
    let attachmentCount = attachmentInfo[0] ? attachmentInfo[0].count : 0;
    if (utils.env.isRelease && attachmentCount >= config.upload.file.maxCount) {
      fs.unlinkSync(path.join(config.upload.file.path, req.file.filename));
      return errorHandler(null, errorMessages.OUT_OF_LIMIT, 401, res);
    }

    const mime = await utils.mime.getMIME(path.join(config.upload.file.path, req.file.filename));

    let attachment = {
      _id: new ObjectID(),
      _owner: req.member._id,
      type: 'attachment',
      mime: mime,
      date: new Date().getTime(),
      fileName: req.file.originalname,
      filePath: req.file.filename,
      size: req.file.size,
      status: 'ok',
      referer: [],
    };
    await dbTool.attachment.insertOne(attachment);

    // 对成员隐藏路径信息
    delete attachment.filePath;
    return res.status(201).send({ status: 'ok', attachment: attachment });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let deleteAttachment = async (req, res, next) => {
  try {
    let _id = ObjectID(req.params.id);
    let attachmentInfo = await dbTool.attachment.findOne({ _id: _id });
    if (!attachmentInfo || !req.member._id.equals(attachmentInfo._owner)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }
    let basePath = attachmentInfo.type === 'avatar' ? config.upload.avatar.path : config.upload.file.path;
    fs.unlinkSync(path.join(basePath, attachmentInfo.filePath));
    await dbTool.attachment.deleteOne({ _id: _id });
    return res.status(204).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let getAttachment = async (req, res, next) => {
  try {
    const currentDate = new Date().toDateString();

    if (!req.member.download || req.member.download.lastUpdate !== currentDate) {
      req.member.download = {
        lastUpdate: currentDate,
        traffic: 0,
      };
    }

    let attachmentInfo = await dbTool.attachment.findOne({ _id: ObjectID(req.params.id) });
    let downloadInfo = req.member.download;

    if (!attachmentInfo) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }

    // 看一看他还有流量不
    if (attachmentInfo.mime.indexOf('image/') !== 0) {
      if (req.member._id === undefined) {
        return errorHandler(null, errorMessages.NEED_LOGIN, 403, res);
      }

      if (downloadInfo.traffic + attachmentInfo.size > config.download.dailyTraffic) {
        return errorHandler(null, errorMessages.TRAFFIC_LIMIT_EXCEEDED, 403, res);
      }

      // 只有文件计费
      downloadInfo.traffic = downloadInfo.traffic + (attachmentInfo.size || 0);
    }

    let dir = attachmentInfo.type === 'avatar' ? config.upload.avatar.path : config.upload.file.path;
    let options = {
      root: dir,
      dotfiles: 'deny',
      headers: {
        'x-timestamp': Date.now(),
        'x-sent': true,
      },
    };

    dbTool.commonMember.updateOne(
      {
        _id: req.member._id,
      }, {
        $set: { download: downloadInfo },
      }
    ).catch(error => console.error(error));

    fs.lstat(path.join(dir, attachmentInfo.filePath), (err, stat) => {
      if (err) {
        if (err.errno === -2) {         // ENOENT
          return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
        } else if (err.errno === -13) { // EACCES
          return errorHandler(null, errorMessages.PERMISSION_DENIED, 403, res);
        } else {  // others
          return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
        }
      } else {
        res.sendFile(attachmentInfo.filePath, options);
      }
    });
  } catch (err) {
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

let getDailyTraffic = async (req, res, next) => {
  if (req.member._id) {
    if (req.member.download === undefined) {
      req.member.download = {};
    }

    return res.status(200).send({
      status: 'ok',
      dailyTraffic: config.download.dailyTraffic,
      usedTraffic: new Date().toDateString() === req.member.download.lastUpdate ? req.member.download.traffic : 0,
    });
  }

  return errorHandler(null, errorMessages.NEED_LOGIN, 403, res);
};

module.exports = {
  deleteAttachment,
  getAttachment,
  getAttachmentInfoByAttachmentId,
  getAttachmentsInfoByMemberId,
  getDailyTraffic,
  uploadAttachment,
};
