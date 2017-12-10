'use strict';

const dbTool = require('../database');
const config = require('../config');

exports = module.exports = {};

/**
 * 获取 type 为 category 的分类，并将其存入配置文件中
 *
 * @returns 读取到的讨论标签白名单
 */
let createDiscussionCategoryWhiteList = async () => {
  await dbTool.prepare();

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
exports.createDiscussionCategoryWhiteList = createDiscussionCategoryWhiteList;

/**
 * 使用原始配置重置讨论的配置
 *
 * @returns 重置后的 discussion 配置信息
 */
let resetCategoryConfig = async () => {
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
  await createDiscussionCategoryWhiteList();

  return originSetting;
};
exports.resetCategoryConfig = resetCategoryConfig;
