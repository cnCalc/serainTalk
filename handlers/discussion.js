'use strict';

const { MongoClient } = require('mongodb');
const config = require('../config');

/**
 * 获取指定标签下最新的讨论
 * /api/v1/discussion/latest?tag=1&tag=2
 * @param {Request} req 
 * @param {Response} res 
 */
function getLatestDiscussionList(req, res) {
  let queryTags = (req.query.tag instanceof Array) ? req.query.tag : [req.query.tag];
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page) || 0;

  MongoClient.connect(config.database, (err, db) => {
    db.collection('discussion').find({
      tags: { $in: queryTags }
    }, {
      creater: 1, title: 1, date: 1, views: 1, tags: 1, status: 1
    }, {
      limit: pagesize,
      skip: offset * pagesize,
      sort: [['date', 'desc']]
    }).toArray((err, results) => {
      res.send({
        status: 'ok',
        discussions: results,
      })
    })
  });
}

module.exports = {
  handlers: [
    {
      path: '/discussion/latest',
      get: getLatestDiscussionList,
    }
  ]
}
