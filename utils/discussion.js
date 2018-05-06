'use strict';

const dbTool = require('../database');

let isIgnored = async (_accepterId, _discussionId) => {
  try {
    let discussionInfo = await dbTool.commonMember.aggregate([
      { $match: { _id: _accepterId } },
      {
        $project: {
          exists: { $in: [_discussionId, '$subscription.ignore.discussions'] },
        },
      },
    ]).toArray();
    return discussionInfo[0].exists;
  } catch (err) {
    return false;
  }
};
exports.isIgnored = isIgnored;

let setIgnore = async (_memberId, _blockId) => {
  return await dbTool.commonMember.updateOne(
    { _id: _memberId },
    {
      $push: { 'subscription.ignore.discussions': _blockId },
      $pull: { 'subscription.watch.discussions': _blockId },
    }
  );
};
exports.setIgnore = setIgnore;
