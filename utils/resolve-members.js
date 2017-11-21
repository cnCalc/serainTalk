'use strict';

const dbTool = require('./database');
const errorHandler = require('./error-handler');
const { ObjectID } = require('mongodb');

/**
 * 从数据库中获取一个用户的信息，并将结果保存至 members 数组中。
 *
 * @param {MongoConnecton} db 数据库链接
 * @param {Object.<String, Member>} members 保存用户信息的对象
 * @param {String} memberId 待获取信息的用户 ID
 */
async function fetchOneMember (db, members, memberId) {
  if (members[memberId]) {
    return;
  } else {
    try {
      let data = await db.collection('common_member').findOne(
        { _id: memberId },
        { username: 1, uid: 1, avatar: 1 }
      );
      if (data) {
        delete data._id;
        members[memberId] = data;
      }
    } catch (err) {
      errorHandler(err);
      members[memberId] = {};
    };
  }
};

/**
 * 解析一组讨论内所有出现的用户信息，在回调中返回ID为Key的用户信息对象
 *
 * @param {Array.<Discussion>} discussions
 * @returns {Promise<Array<Member>>)}
 */
async function resloveMembersInDiscussionArray (discussions) {
  let members = {};
  let membersToFetch = discussions.reduce((arr, discussion) => arr.concat([discussion.creater, discussion.lastMember]), []);
  await Promise.all([...new Set(membersToFetch)].map(memberId => fetchOneMember(dbTool.db, members, memberId)));
  return members;
}

/**
 * 解析单个讨论内所有出现的用户信息，在回调中返回ID为Key的用户信息对象
 *
 * @param {Discussion} discussion
 * @returns {Promise<Array<Member>>}
*/
async function resloveMembersInDiscussion (discussion) {
  let members = {};
  let membersToFetch = discussion.posts.reduce((arr, post) => arr.concat([post.user.toString(), post.replyTo ? post.replyTo.memberId.toString() : null]), []);
  await Promise.all([...new Set(membersToFetch.filter(id => id !== null))].map(memberId => fetchOneMember(dbTool.db, members, ObjectID(memberId))));
  return members;
}

module.exports = {
  resloveMembersInDiscussionArray,
  resloveMembersInDiscussion
};
