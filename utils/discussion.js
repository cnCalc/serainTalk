'use strict';

const dbTool = require('../database');

let isIgnored = async (_accepterId, _discussionId) => {
  try {
    let discussionInfo = await dbTool.commonMember.aggregate([
    { $match: { _id: _accepterId } },
      {
        $project: {
          exists: { $in: [_discussionId, '$notifications.ignore.discussions'] },
        },
      },
    ]).toArray();
    return discussionInfo[0].exists;
  } catch (err) {
    return false;
  }
};
exports.isIgnored = isIgnored;
