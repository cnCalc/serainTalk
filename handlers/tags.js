'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

/**
 * 获取论坛内所有的 tag
 * /api/v1/tags/all
 * @param {Request} req 
 * @param {Response} res 
 */
function getAllTags(req, res) {
  MongoClient.connect(config.database, (err, db) => {
    db.collection('discussion').distinct('tags', (err, docs) => {
      if (err) {
        res.code(500).send({
          status: 'err'
        })
      } else {
        res.send({
          status: 'ok',
          tags: docs
        });
      }
    });
  })
}

function getPinnedTags(req, res) {
  MongoClient.connect(config.database, (err, db) => {
    db.collection('generic').find({key: 'pinned-tags'}).toArray((err, docs) => {
      if (err) {
        console.log(err);
        res.code(500).send({
          status: 'err',
          message: 'server side database error.'
        });
      } else {
        res.send({
          status: 'ok',
          tags: docs[0].tags
        });
      }
    })
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
}
