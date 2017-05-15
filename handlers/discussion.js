'use strict';

const { MongoClient, ObjectID } = require('mongodb');
const config = require('../config');
const { resloveMembersInDiscussions } = require('../utils/resolve-members');

/**
 * 获取指定标签下最新的讨论
 * /api/v1/discussions/latest?tag=1&tag=2&page=1&pagesize=10
 * 当没有标签时，查询整站的讨论
 * 按照最新回复排序
 * @param {Request} req 
 * @param {Response} res 
 */
function getLatestDiscussionList(req, res) {
  let query = {};
  if (req.query.tag) {
    query = {
      tags: { $in: (req.query.tag instanceof Array) ? req.query.tag : [req.query.tag] }
    }
  }
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;

  MongoClient.connect(config.database, (err, db) => {
    db.collection('discussion').find(query, {
      creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, lastMember: 1,
    }, {
      limit: pagesize,
      skip: offset * pagesize,
      sort: [['lastDate', 'desc']]
    }).toArray((err, results) => {
      if (err) {
        res.status(500).send({
          status: 'err',
          message: 'server side database error.'
        })
      } else {
        resloveMembersInDiscussions(results, (err, members) => {
          res.send({
            status: 'ok',
            discussions: results,
            members
          });
        });
      }
    })
  });
}

/**
 * 根据 ID 获得指定讨论
 * /api/v1/discussion/:id
 * @param {Request} req 
 * @param {Response} res 
 */
function getDiscussionById(req, res) {
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;
  let discussionId;
  try {
    discussionId = ObjectID(req.params.id);
  } catch (err) {
    res.status(400).send({
      status: 'err',
      message: 'invalid user id.'
    });
    return;
  }

  MongoClient.connect(config.database, (err, db) => {
    db.collection('discussion').find({
      _id: ObjectID(discussionId)
    }, {
      creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, posts: 1, lastMember: 1,
    }, {
      limit: pagesize,
      skip: offset * pagesize,
      sort: [['lastDate', 'desc']]
    }).toArray((err, results) => {
      if (err) {
        res.status(500).send({
          status: 'err',
          message: 'server side database error.'
        })
      } else if (results.length !== 1) {
        res.send({
          status: 'ok',
        })
      } else {
        res.send(Object.assign({status: 'ok'}, results[0]));
      }
    })
  });
}


module.exports = {
  handlers: [
    {
      path: '/discussions/latest',
      get: getLatestDiscussionList,
    }, {
      path: '/discussion/:id',
      get: getDiscussionById,
    }
  ]
}
