'use strict';

const _ = require('lodash');
const dbTool = require('../database');
const errorHandler = require('./error-handler');

/**
 * 从数据库中获取一个附件的信息。
 *
 * @param {MongoID} _attachmentId 待获取信息的用户 ID
 */
let fetchOneAttachment = async (_attachmentId) => {
  try {
    let attachmentInfo = await dbTool.attachment.findOne(
      { _id: _attachmentId },
      { filePath: false }
    );
    if (!attachmentInfo) return {};
    else return attachmentInfo;
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err);
    /* istanbul ignore next */
    return {};
  }
};

/**
 * 附件鉴权。是否为本人的附件。
 *
 * @param {MongoID[]} _attachments
 * @param {MongoID} _memberId
 * @returns {Boolean}
 */
let isSelfAttachment = async (_attachments, _memberId) => {
  let attachmentsInfo = _attachments.map(_attachmentId => fetchOneAttachment(_attachmentId));
  attachmentsInfo = await Promise.all(attachmentsInfo);
  attachmentsInfo = attachmentsInfo.filter(attachmentInfo => _memberId.equals(attachmentInfo._owner));
  return _attachments.length === attachmentsInfo.length;
};

/**
 * 解析一组 post 内所有出现的附件信息
 *
 * @param {Post[]} posts
 * @returns {attachmentInfo[]} attachmentsInfo
 */
async function resolveAttachmentsInPosts (posts) {
  let attachmentToFetch = [];
  attachmentToFetch = posts.reduce((_attachments, post) => {
    return _attachments.concat(post.attachments);
  }, attachmentToFetch);
  attachmentToFetch = _.unionWith(attachmentToFetch, (a, b) => a.toString() === b.toString());
  let attachmentsInfo = await Promise.all(attachmentToFetch.map(_attachmentId => {
    return fetchOneAttachment(_attachmentId);
  }));
  let attachments = {};
  attachmentsInfo.forEach(attachment => {
    attachments[attachment._id] = attachment;
  });
  return attachments;
}

module.exports = {
  fetchOneAttachment,
  isSelfAttachment,
  resolveAttachmentsInPosts,
};
