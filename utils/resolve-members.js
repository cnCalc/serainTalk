'use strict';

const dbTool = require('./database');
const errorHandler = require('./error-handler');

function fetchOneMember (db, members, memberId) {
  return new Promise((resolve, reject) => {
    if (members[memberId]) {
      resolve();
    } else {
      db.collection('common_member').findOne({
        _id: memberId
      }, {
        username: 1, uid: 1,
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
