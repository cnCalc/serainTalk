'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');
const errorHandler = require('../utils/error-handler');
const errorMessages = require('../utils/error-messages');

/**
 * 获取论坛内所有的 tag
 * /api/v1/tags/all
 * @param {Request} req
 * @param {Response} res
 */
function getAllTags (req, res) {
  MongoClient.connect(config.database, (err, db) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
      return;
    }
    db.collection('discussion').distinct('tags', (err, docs) => {
      if (err) {
        errorHandler(err, errorMessages.DB_ERROR, 500, res);
      } else {
        res.send({
          status: 'ok',
          tags: docs
        });
      }
    });
  });
}

function getPinnedTags (req, res) {
  MongoClient.connect(config.database, (err, db) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
      return;
    }
    db.collection('generic').find({ key: 'pinned-tags' }).toArray((err, docs) => {
      if (err) {
        errorHandler(err, errorMessages.DB_ERROR, 500, res);
      } else {
        res.send({
          status: 'ok',
          tags: docs[0].tags
        });
      }
    });
  });
}

module.exports = {
  handlers: [
    {
      path: '/tags',
      get: getAllTags,
    }, {
      path: '/tags/pinned',
      get: getPinnedTags,
    }
  ]
};
