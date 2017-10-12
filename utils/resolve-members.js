'use strict';

const dbTool = require('./database');
const errorHandler = require('./error-handler');

/**
 * 从数据库中获取一个用户的信息，并将结果保存至 members 数组中。
 *
 * @param {MongoConnecton} db 数据库链接
 * @param {Object.<String, Member>} members 保存用户信息的对象
 * @param {String} memberId 待获取信息的用户 ID
 */
function fetchOneMember (db, members, memberId) {
  return new Promise((resolve, reject) => {
    if (members[memberId]) {
      resolve();
    } else {
      db.collection('common_member').findOne({
        _id: memberId
      }, {
        username: 1, uid: 1, avatar: 1,
      }).then(data => {
        delete data._id;
        members[memberId] = data;
        resolve();
      }).catch(err => {
        errorHandler(err);
        members[memberId] = {};
        resolve();
      });
    }
  });
};

/**
 * 解析一组讨论内所有出现的用户信息，在回调中返回ID为Key的用户信息对象
 *
 * @param {Array.<Discussion>} discussions
 * @param {Function(err, Object.<String, Member>)} callback
 */
function resloveMembersInDiscussionArray (discussions, callback) {
  let members = {};
  let membersToFetch = discussions.reduce((arr, discussion) => arr.concat([discussion.creater, discussion.lastMember]), []);
  Promise.all([...new Set(membersToFetch)].map(memberId => fetchOneMember(dbTool.db, members, memberId))).then(() => {
    callback(null, members);
  }).catch(err => {
    callback(err);
  });
}

/**
 * 解析单个讨论内所有出现的用户信息，在回调中返回ID为Key的用户信息对象
 *
 * @param {Discussion} discussion
 * @param {Function(err, Object.<String, Member>)} callback
 */
function resloveMembersInDiscussion (discussion, callback) {
  let members = {};
  let membersToFetch = discussion.posts.reduce((arr, post) => arr.concat([post.user]), []);
  Promise.all([...new Set(membersToFetch)].map(memberId => fetchOneMember(dbTool.db, members, memberId))).then(() => {
    callback(null, members);
  }).catch(err => {
    callback(err);
  });
}

module.exports = {
  resloveMembersInDiscussionArray,
  resloveMembersInDiscussion
};
