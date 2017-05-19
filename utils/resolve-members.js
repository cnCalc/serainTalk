'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');
const errorHandler = require('./error-handler');

/**
 * 解析一组讨论内所有出现的用户信息，在回调中返回ID为Key的用户信息对象
 * @param {Array.<Discussion>} discussions
 * @param {Function(err, Object.<String, Member>)} callback
 */
function resloveMembersInDiscussions (discussions, callback) {
  MongoClient.connect(config.database, (err, db) => {
    if (err) {
      errorHandler(err);
      return;
    }
    let members = {};
    let fetchOneMember = memberId => {
      return new Promise((resolve, reject) => {
        if (members[memberId]) {
          resolve();
        } else {
          db.collection('common_member').findOne({
            _id: memberId
          }, {
            username: 1,
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
    let membersToFetch = discussions.reduce((arr, discussion) => arr.concat([discussion.creater, discussion.lastMember]), []);
    Promise.all([...new Set(membersToFetch)].map(fetchOneMember)).then(() => {
      callback(null, members);
    }).catch(err => {
      callback(err);
    });
  });
}

module.exports = {
  resloveMembersInDiscussions
};
