'use strict';

const { MongoClient, ObjectID } = require('mongodb');
const config = require('../config');

let slugCache = null;

function flushCache(callback) {
  MongoClient.connect(config.database, (err, db) => {
    db.collection('generic').findOne({key: 'pinned-categories'}).then(doc => {
      let cache = {};
      for (let group of doc.groups) {
        for (let category of group.categories) {
          cache[category.slug] = category.name;
        }
      }
      slugCache = cache;
      callback(null);
    }).catch(err => {
      callback(err);
    });
  });
}

function slugToCategory(slug, callback) {
  if (slugCache[slug]) {
    callback(null, slugCache[slug]);
  } else {
    flushCache(err => {
      if (err) {
        callback(err);
      } else {
        callback(null, slugCache[slug]);
      }
    })
  }
}

// Flush it immediately
flushCache(err => {
  if (err) {
    console.log(err);
    process.exit(10);
  }
})

/**
 * 获得所有板块和分区信息
 * /api/v1/categories
 * @param {Request} req 
 * @param {Response} res 
 */
function getCategoryList(req, res) {
  MongoClient.connect(config.database, (err, db) => {
    db.collection('generic').findOne({key: 'pinned-categories'}).then(doc => {
      res.send({
        status: 'ok',
        groups: doc.groups,
      });
    }).catch(err => {
      res.status(500).send({
        status: 'err',
        message: 'server side database error.'
      });
    });
  });
}

/**
 * 获得指定分区下的所有讨论
 * /api/v1/category/:slug/discussions
 * @param {Request} req 
 * @param {Response} res 
 */
function getDiscussionsUnderSpecifiedCategory(req, res) {
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;

  MongoClient.connect(config.database, (err, db) => {
    slugToCategory(req.params.slug, (err, category) => {
      if (err) {
        console.log(err);
        res.status(500).send({
          status: 'err',
          message: 'server fucked up.'
        });
      } else if (typeof category === 'undefined') {
        res.send({
          status: 'ok',
        });
      } else {
        db.collection('discussion').find({
          category
        }, {
          creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1
        }, {
          limit: pagesize,
          skip: offset * pagesize,
          sort: [['lastDate', 'desc']]
        }).toArray((err, results) => {
          res.send({
            status: 'ok',
            discussions: results,
          });
        })
      }
    })
  });
}

module.exports = {
  handlers: [
    {
      path: '/categories',
      get: getCategoryList,
    }, {
      path: '/category/:slug/discussions',
      get: getDiscussionsUnderSpecifiedCategory,
    }
  ]
}
