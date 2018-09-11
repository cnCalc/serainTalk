'use strict';

const { ObjectID } = require('mongodb');
const childProcess = require('child_process');
const util = require('util');

exports = module.exports = {};

/**
 * [工具] 快速上传附件。
 * 后续操作完成后会将该附件销毁。
 *
 * @param {Agent} agent superAgent 实例
 * @param {any} filePath 选填，上传指定附件。
 * @param {Promise} next 新建完成后需要执行的操作函数。会将附件的信息作为参数传入。
 */
let uploadOneAttachment = async (agent, filePath, next) => {
  let uploadUrl = '/api/v1/attachment';
  let fileRes = await agent.post(uploadUrl)
    .attach('file', filePath || './test/testfile/attachment.txt')
    .expect(201);
  let attachmentInfo = fileRes.body.attachment;
  attachmentInfo.id = attachmentInfo._id;
  attachmentInfo._id = ObjectID(attachmentInfo._id);
  try {
    await next(attachmentInfo);
  } catch (err) {
    throw err;
  } finally {
    let deleteUrl = `/api/v1/attachment/${fileRes.body.attachment._id}`;
    await agent.delete(deleteUrl).expect(204);
  }
};
exports.uploadOneAttachment = uploadOneAttachment;

/**
 * 创建指定大小的附件
 *
 * @param {Number} fileName 要创建的附件名称
 * @param {Number} size 要创建的附件大小
 * @param {Promise} next 新建完成后需要执行的操作函数。会将新附件的路径作为参数传入。
 */
let createAttachmentFile = async (fileName, size, next) => {
  fileName = fileName || `${size / 1024 / 1024}M.txt`;
  let testFilePath = `./test/testfile/${fileName}`;
  let promiseExec = util.promisify(childProcess.exec);
  await promiseExec(`dd if=/dev/zero of=${testFilePath} count=1 bs=${size}`);

  await next(testFilePath);

  await promiseExec(`rm ${testFilePath}`);
};
exports.createAttachmentFile = createAttachmentFile;
