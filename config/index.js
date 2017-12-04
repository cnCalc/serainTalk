'use strict';

const dev = require('./dev');
const procduct = require('./procduct');
const _ = require('lodash');
const mocha = require('./mocha');

let config = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  siteAddress: 'https://www.cncalc.org', // 末尾不要加'/'
  cookie: {
    renewTime: 86400000
  },
  tokenValidTime: 1000 * 60 * 10,
  password: {
    resetPasswordPage: 'https://www.cncalc.org/resetpassword.html'
  },
  member: {
    privateField: ['credentials', 'notifications']
  },
  discussion: {
    category: {
      whiteList: 'loading'
    },
    post: {
      vote: [
        'up',
        'down',
        'laugh',
        'doubt',
        'cheer',
        'emmmm',
      ]
    },
    freqLimit: 1000 * 60 * 3, // 发帖间隔
    reset: 'loading'
  },
};

// 优先导出部分基础配置信息
exports = module.exports = config;
// console.log(process.env.NODE_ENV);
/* istanbul ignore next */
switch (process.env.NODE_ENV) {
  case 'PROCDUCT': _.merge(config, procduct); break;
  case 'MOCHA': _.merge(config, mocha); break;
  default: _.merge(config, dev);
}

/**
 * 使用原始配置重置讨论的配置
 *
 * @returns 重置后的 discussion 配置信息
 */

let resetDiscussionConfig = async () => {
  await dbTool.prepare();
  let originSetting = require('./category.json');
  let genericDoc = await dbTool.generic.updateMany(
    {
      key: 'pinned-categories'
    },
    {
      $set: originSetting
    }
  );
  /* istanbul ignore next */
  if (genericDoc.matchedCount === 0) {
    originSetting.key = 'pinned-categories';
    await dbTool.generic.insertOne(originSetting);
  }
  await setDiscussionCategoryWhiteList();

  return originSetting;
};
exports.discussion.reset = resetDiscussionConfig;

/**
 * 获取 type 为 category 的分类，并将其存入配置文件中
 *
 * @returns 读取到的讨论标签白名单
 */
let setDiscussionCategoryWhiteList = async () => {
  let whiteList = await dbTool.generic.aggregate([
    { $match: { key: 'pinned-categories' } },
    { $unwind: '$groups' },
    { $unwind: '$groups.items' },
    { $match: { 'groups.items.type': 'category' } },
    { $project: { name: '$groups.items.name', _id: 0 } }
  ]).toArray();
  whiteList = whiteList.map(item => item.name);
  config.discussion.category.whiteList = whiteList;

  return whiteList;
};

let dbTool;
/**
 * 从数据库读取额外配置
 *
 */
let updateConfigFromDatabase = async () => {
  dbTool = require('../utils/database');
  await dbTool.prepare();
  await resetDiscussionConfig();
  setDiscussionCategoryWhiteList();
};

// dbTool 模块生成完成后再读取额外配置
setTimeout(updateConfigFromDatabase, 0);
