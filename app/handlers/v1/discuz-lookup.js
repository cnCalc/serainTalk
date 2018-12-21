'use strict';

const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

const lookupDiscuzId = async (req, res) => {
  if (req.query.tid !== undefined) {
    const discussion = await dbTool.discussion.findOne(
      { tid: Number(req.query.tid) },
      { projection: { _id: 1 } },
    );

    if (discussion === null) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }

    return res.status(200).send({
      status: 'ok',
      discussionId: discussion._id,
    });
  }

  errorHandler(null, errorMessages.BAD_REQUEST, 400, res);
};

module.exports = {
  lookupDiscuzId,
};
