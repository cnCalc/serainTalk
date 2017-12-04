'use strict';

const dbTool = require('./database');
const errorHandler = require('./error-handler');
const { ObjectID } = require('mongodb');

/**
 * 从数据库中获取一个用户的信息，并将结果保存至 members 数组中。
 *
 * @param {MongoID} memberId 待获取信息的用户 ID
 */
let fetchOneMember = async (memberId) => {
  try {
    let memberInfo = await dbTool.commonMember.findOne(
      { _id: memberId },
      { username: 1, uid: 1, avatar: 1, _id: 0 }
    );
    if (!memberInfo) return {};
    else return memberInfo;
  } catch (err) {
    /* istanbul ignore next */
    errorHandler(err);
    /* istanbul ignore next */
    return {};
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
  await Promise.all([...new Set(membersToFetch)].map(async memberId => { members[memberId] = await fetchOneMember(ObjectID(memberId)); }));
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
  await Promise.all([...new Set(membersToFetch.filter(id => id !== null))].map(async memberId => { members[memberId] = await fetchOneMember(ObjectID(memberId)); }));
  return members;
}

module.exports = {
  resloveMembersInDiscussionArray,
  resloveMembersInDiscussion
};
