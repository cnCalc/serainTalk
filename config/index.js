'use strict';

const _ = require('lodash');
const dev = require('./dev');
const product = require('./product');
const mocha = require('./mocha');

let config = require('./staticConfig');
let env = require('../utils/env');

// console.log(process.env.NODE_ENV);
/* istanbul ignore next */
if (env.isProd) {
  _.merge(config, product);
} else if (env.isMocha) {
  _.merge(config, mocha);
} else {
  _.merge(config, dev);
}

/**
 * 从数据库读取额外配置
 *
 */
let initConfig = async () => {
  const dbTool = require('../database');
  await dbTool.prepare();
  let utils = require('../utils');

  const { resetCategoryConfig, createDiscussionCategoryWhiteList } = utils.category;

  // 如果没有配置则初始化数据
  let genericConfig = await dbTool.generic.find({}).toArray();
  if (genericConfig.length === 0 || utils.env.isMocha || utils.env.isDev) await require('../database-init').init;
  // 生成讨论分类白名单
  let categoryConfig = await dbTool.generic.findOne({ key: 'pinned-categories' });
  if (!categoryConfig) await resetCategoryConfig();
  createDiscussionCategoryWhiteList();

  // 生成用户权限表
  let permissionsDoc = await dbTool.generic.findOne({ key: 'permissions' }, { _id: 0, key: 0 });
  let permissions = permissionsDoc.permissions;
  // 缓存一份到配置中
  config.permissions = permissions;
  let memberSet = new Set();
  let memberPermissions = {};
  for (let permissionType of Object.keys(permissions)) {
    for (let permissionName of Object.keys(permissions[permissionType])) {
      for (let memberType of permissions[permissionType][permissionName].allow) {
        memberSet.add(memberType);
        if (memberPermissions[memberType]) memberPermissions[memberType].push(`${permissionType}-${permissionName}`);
        else memberPermissions[memberType] = [`${permissionType}-${permissionName}`];
      }
    }
  }
  config.member.types = [...memberSet];
  config.member.permissions = memberPermissions;
};

let init = initConfig();
config.prepare = async () => {
  await init;
};
module.exports = config;
