'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

// region 发送通知（暂不启用）
// let sendNotification = {
//   params: {
//     id: interfaceUtils.mongoId
//   },
//   body: {
//     content: joi.string().required(),
//     href: joi.string(),
//   }
// };
// exports.sendNotification = sendNotification;
// endregion

let getNotification = {
  query: {
    pagesize: interfaceUtils.pagesize,
    page: interfaceUtils.page,
    after: joi.number().default(0)
  }
};
exports.getNotification = getNotification;

let readNotification = {
  params: {
    index: joi.number().min(0).required()
  }
};
exports.readNotification = readNotification;

let readAllNotification = {};
exports.readAllNotification = readAllNotification;
