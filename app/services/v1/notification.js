'use strict';

const dbTool = require('../../../database');

exports = module.exports = {};

const findAndCount = async (query, option) => {
  let notificationsInfo = await dbTool.commonMember.aggregate([
    { $match: { _id: query._id } },
    { $project: { notifications: 1, _id: 0 } },
    { $unwind: '$notifications' },
    { $match: { 'notifications.date': { $gt: option.after } } },
    { $sort: { 'notifications.date': -1 } },
    { $group: { _id: null, notifications: { $push: '$$ROOT' }, count: { $sum: 1 } } },
    { $project: { _id: 0, count: 1, notifications: { $slice: ['$notifications', option.offset, option.pagesize] } } },
  ]).toArray();
  notificationsInfo = notificationsInfo[0];
  if (!notificationsInfo) return { count: 0, notifications: [] };

  notificationsInfo.notifications = notificationsInfo.notifications.map(notificationItem => notificationItem.notifications);
  return notificationsInfo;
};
exports.findAndCount = findAndCount;

const read = async (query, option) => {
  let data = {};
  if (option.index) data[`notifications.${option.index - 1}.hasRead`] = true;
  await dbTool.commonMember.updateOne(
    { _id: query._id },
    { $set: data }
  );

  let resInfo = await dbTool.commonMember.findOne({ _id: query._id });
  return resInfo.notifications[option.index - 1];
};
exports.read = read;
