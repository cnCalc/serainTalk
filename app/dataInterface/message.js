'use strict';

const joi = require('joi');
const interfaceUtils = require('./interfaceUtils');

exports = module.exports = {};

// 发送一条私信
let sendMessage = {
  params: joi.object({
    memberId: interfaceUtils.mongoId,
  }),
  body: joi.object({
    content: joi.string().required(),
  }),
};
exports.sendMessage = sendMessage;

// 获取自己所有的私信列表（摘要）
let getMessagesInfo = {
};
exports.getMessagesInfo = getMessagesInfo;

// 获取与指定的人的私信记录
let getMessageByMemberId = {
  params: joi.object({
    memberId: interfaceUtils.mongoId.required(),
  }),
  query: joi.object({
    beforeDate: joi.number(),
    afterDate: joi.number(),
    pagesize: interfaceUtils.pagesize,
  }),
};
exports.getMessageByMemberId = getMessageByMemberId;

// 获取指定 ID 的私信
let getMessageById = {
  params: joi.object({
    id: interfaceUtils.mongoId.required(),
  }),
  query: joi.object({
    beforeDate: joi.number(),
    afterDate: joi.number(),
    pagesize: interfaceUtils.pagesize,
  }),
};
exports.getMessageById = getMessageById;
