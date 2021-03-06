'use strict';

const dbTool = require('../database');
const object = require('./object');
const errorMessages = require('./error-messages');
const ws = require('./websocket');

exports = module.exports = {};

/**
 * 发送一条通知给指定成员
 *
 * @param {MongoId} _memberId 成员ID
 * @param {any} notification
 * - @param {string} content 通知内容
 * - @param {url} href 附带链接
 * @returns {Promise}
 */
let sendNotification = async (_memberId, notification) => {
  let now = Date.now();
  notification.date = now;
  notification.hasRead = false;

  await dbTool.commonMember.updateOne(
    { _id: _memberId },
    { $push: { notifications: object.removeUndefined(notification) } }
  );

  // 动态生成 index
  let memberInfo = await dbTool.commonMember.findOne({ _id: _memberId });
  if (!memberInfo) {
    let err = new Error(errorMessages.MEMBER_NOT_EXIST.message);
    err.code = errorMessages.MEMBER_NOT_EXIST.code;
    throw err;
  }

  let notificationList = memberInfo.notifications;
  for (let i = notificationList.length - 1; i >= 0; i--) {
    if (notificationList[i].index === undefined) {
      let updateInfo = { $set: {} };
      updateInfo.$set[`notifications.${i}.index`] = i + 1;
      await dbTool.commonMember.updateOne(
        { _id: _memberId },
        updateInfo
      );
    } else break;
  }

  const connections = ws.connections[_memberId.toString()];
  if (connections && connections.length > 0) {
    connections.forEach(conn => {
      conn.emit('notification', notification);
    });
  }
};

exports.sendNotification = sendNotification;
