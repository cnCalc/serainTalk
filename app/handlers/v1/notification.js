'use strict';

const dbTool = require('../../../database');
const utils = require('../../../utils');
const services = require('../../services');
const { errorHandler, errorMessages } = utils;

// #region 发送通知（暂不启用）
// /**
//  * 发送一条通知给指定成员
//  *
//  * @param {any} req
//  * @param {any} res
//  * @param {any} next
//  * @returns
//  */
// let sendNotification = async (req, res, next) => {
//   let _id = ObjectID(req.params.id);
//   let now = Date.now();
//   let notification = {
//     date: now,
//     content: req.body.content,
//     href: req.body.href,
//     hasRead: false
//   };
//   let updateRes = await dbTool.commonMember.updateOne(
//     { _id: _id },
//     { $push: { notifications: utils.object.removeUndefined(notification) } }
//   );

//   // 动态生成 index
//   let memberInfo = await dbTool.commonMember.findOne({ _id: _id });
//   let notificationList = memberInfo.notifications;
//   for (let i = notificationList.length - 1; i >= 0; i--) {
//     if (notificationList[i].index === undefined) {
//       let updateInfo = { $set: {} };
//       updateInfo.$set[`notifications.${i}.index`] = i + 1;
//       await dbTool.discussion.update(
//         { _id: _id },
//         updateInfo
//       );

//       // 为返回结果添上 index
//       if (notificationList[i].date === now) {
//         notification.index = i + 1;
//       }
//     } else break;
//   }

//   // 无此接收者
//   if (updateRes.modifiedCount !== 1) {
//     return errorHandler(null, errorMessages.MEMBER_NOT_EXIST, 400, res);
//   }
//   return res.status(201).send({ status: 'ok', newNotification: notification });
// };
// #endregion

/**
 * 获取自己的通知列表
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 */
let getNotification = async (req, res, next) => {
  try {
    let option = {
      after: req.query.after,
      pagesize: req.query.pagesize,
      offset: req.query.page - 1,
    };
    let query = {
      _id: req.member._id,
    };
    let notificationsInfo = await services.v1.notification.findAndCount(query, option);

    return res.status(200).send(Object.assign({ status: 'ok' }, notificationsInfo));
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let readNotification = async (req, res, next) => {
  try {
    let query = {
      _id: req.member._id,
    };
    let option = {
      index: req.params.index,
    };
    let readInfo = await services.v1.notification.read(query, option);

    return res.status(201).send({ status: 'ok', notificationInfo: readInfo });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let readAllNotification = async (req, res, next) => {
  try {
    let unReadList = await dbTool.commonMember.aggregate([
      { $match: { _id: req.member._id } },
      { $project: { notification: '$notifications' } },
      { $unwind: '$notification' },
    ]).toArray();
    unReadList = unReadList.map(doc => doc.notification);
    let updateInfo = {};
    for (let notification of unReadList) {
      updateInfo[`notifications.${notification.index - 1}.hasRead`] = true;
    }

    await dbTool.commonMember.updateMany(
      { _id: req.member._id },
      { $set: updateInfo }
    );
    return res.status(201).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

module.exports = {
  getNotification,
  readNotification,
  readAllNotification,
};
