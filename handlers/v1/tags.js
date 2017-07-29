'use strict';

const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const router = express.Router();

/**
 * 获取论坛内所有的 tag
 * /api/v1/tags/all
 * @param {Request} req
 * @param {Response} res
 */
function getAllTags (req, res) {
  dbTool.db.collection('discussion').distinct('tags', (err, docs) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
    } else {
      res.send({
        status: 'ok',
        tags: docs
      });
    }
  });
}

function getPinnedTags (req, res) {
  dbTool.db.collection('generic').find({ key: 'pinned-tags' }).toArray((err, docs) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
    } else {
      res.send({
        status: 'ok',
        tags: docs[0].tags
      });
    }
  });
}

router.get('/', getAllTags);
router.get('/pinned', getPinnedTags);

module.exports = router;
