'use strict';

const { MongoClient, ObjectID } = require('mongodb');
const config = require('../config');

function resloveMembersInDiscussions(discussions, callback) {
  MongoClient.connect(config.database, (err, db) => {
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
            members[memberId] = {};
            resolve();
          })
        }
      });
    };
    let membersToFetch = discussions.reduce((arr, discussion) => arr.concat([discussion.creater, discussion.lastMember]), []);
    Promise.all([...new Set(membersToFetch)].map(fetchOneMember)).then(() => {
      callback(null, members);
    }).catch(err => {
      callback(err);
    })
  })
}

module.exports = {
  resloveMembersInDiscussions
}