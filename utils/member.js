'use strict';

const fs = require('fs');
const path = require('path');

const config = require('../config');
const dbTool = require('../database');
const permission = require('./permission');

exports = module.exports = {};

/**
 * 移除成员里的私密信息
 * 会修改原对象
 *
 * @param {Member} memberInfo
 * @returns {Member}
 */
let removePrivateField = async (memberInfo, permissions) => {
  for (let field of config.member.privateField) {
    delete memberInfo[field];
  }
  return memberInfo;
};
exports.removePrivateField = removePrivateField;

let removeProtectedField = async (memberInfo, permissions) => {
  let settings = memberInfo.settings;
  for (let field of config.member.protectedField) {
    switch (field) {
      case 'email': {
        if (!await permission.checkPermission('member-readPublicEmail', permissions)) {
          delete memberInfo[field];
        } else if (!settings || !settings.privacy || !settings.privacy.showEmailToMembers) {
          let email = memberInfo[field];
          email = email.split('@');
          if (email.length !== 2 || !email[0].length || !email[1].length) break;
          let domain = email[1].split('.');
          if (domain.length !== 2 || !domain[0].length || !domain[1].length) break;
          memberInfo[field]
            = email[0][0]
            + '*'.repeat(5)
            + '@'
            + domain[0][0]
            + '*'.repeat(3)
            + '.'
            + domain[1];
        }
        break;
      }
      default: delete memberInfo[field];
    }
  }
  return memberInfo;
};

let removeSensitiveField = async (memberInfo, permissions) => {
  await removeProtectedField(memberInfo, permissions);
  await removePrivateField(memberInfo, permissions);
  return memberInfo;
};
exports.removeSensitiveField = removeSensitiveField;

let getIgnore = async (_memberId) => {
  let memberInfo = await dbTool.commonMember.aggregate([
    { $match: { _id: _memberId } },
    { $project: { notifications: 1 } },
  ]).toArray();

  return memberInfo.notifications.ignore;
};
exports.getIgnore = getIgnore;

let setIgnore = async (_memberId, _blockId) => {
  return await dbTool.commonMember.updateOne(
    { _id: _memberId },
    { $push: { 'subscription.ignore.members': _blockId } },
  );
};
exports.setIgnore = setIgnore;

let isIgnored = async (_accepterId, _senderId) => {
  try {
    let memberInfo = await dbTool.commonMember.aggregate([
      { $match: { _id: _accepterId } },
      {
        $project: {
          exists: { $in: [_senderId, '$subscription.ignore.members'] },
        },
      },
    ]).toArray();
    return memberInfo[0].exists;
  } catch (err) {
    return false;
  }
};
exports.isIgnored = isIgnored;

let getInviteCodes = () => {
  return new Promise((resolve, reject) => {
    let codePath = path.join(__dirname, '..', 'config', 'invite-code.json');
    fs.readFile(codePath, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        fs.writeFileSync(codePath, '[]', { encoding: 'utf8' });
        resolve([]);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
};
exports.getInviteCodes = getInviteCodes;
