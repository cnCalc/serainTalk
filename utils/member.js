'use strict';

const config = require('../config');
const dbTool = require('../database');

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

let removeProtectedField = (memberInfo) => {
  for (let field of config.member.protectedField) {
    delete memberInfo[field];
  }
  return memberInfo;
};

let removeSensitiveField = (memberInfo) => {
  removePrivateField(memberInfo);
  removeProtectedField(memberInfo);
  return memberInfo;
};
exports.removeSensitiveField = removeSensitiveField;

let getIgnore = async (_memberId) => {
  let memberInfo = await dbTool.commonMember.aggregate([
    { $match: { _id: _memberId } },
    { $project: { ignores: 1 } }
  ]).toArray();

  return memberInfo.ignores;
};
exports.getIgnore = getIgnore;

let isIgnored = async (_accepterId, _senderId) => {
  try {
    let memberInfo = await dbTool.commonMember.aggregate([
      { $match: { _id: _accepterId } },
      {
        $project: {
          exists: { $in: [_senderId, '$ignores.notification.members'] }
        }
      }
    ]).toArray();
    return memberInfo[0].exists;
  } catch (err) {
    return false;
  }
};
exports.isIgnored = isIgnored;
