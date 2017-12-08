'use strict';

const config = require('../config');

exports = module.exports = {};

/**
 * 移除成员里的私密信息
 * 会修改原对象
 *
 * @param {Member} memberInfo
 * @returns {Member}
 */
let removePrivateField = (memberInfo) => {
  for (let field of config.member.privateField) {
    delete memberInfo[field];
  }
  return memberInfo;
};
exports.removePrivateField = removePrivateField;
