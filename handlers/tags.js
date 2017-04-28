'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

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

module.exports = {
  handlers: [
    {
      path: '/tags/all',
      get: getAllTags,
    }
  ]
}
