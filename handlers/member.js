'use strict';

const { MongoClient, ObjectID } = require('mongodb');
const config = require('../config');

/**
 * 根据用户 ID 获得用户信息以及最近活动
 * /api/v1/member/:id
 * @param {Request} req 
 * @param {Response} res 
 */
function getMemberInfoById(req, res) {
  if (!req.params.id) {
    res.status(400).send({
      status: 'err',
      message: 'missing user id.'
    });
  } else {
    let userId;
    try {
      userId = ObjectID(req.params.id);
    } catch (err) {
      res.status(400).send({
        status: 'err',
        message: 'invalid user id.'
      });
      return;
    }
    MongoClient.connect(config.database, (err, db) => {
      if (err) {
        console.error(err);
        res.status(500).send({
          status: 'error',
          message: 'server side database error.'
        });
      } else {
        // 查询用户的基础信息
        db.collection('common_member').find({
          _id: userId
        }).toArray((err, results) => {
          if (results.length != 1) {
            res.send({
              status: 'ok',
            });
          } else {
            let result = Object.assign({
              status: 'ok'
            }, results[0]);

            // 删除用户的登陆凭据部分
            delete result['credentials'];

            // 获得此用户最近的帖子
            db.collection('discussion').aggregate([{
              $match: {
                'posts.user': userId
              }
            }, {
              $project: {
                posts: {
                  $filter: {
                    input: '$posts',
                    as: 'post',
                    cond: { $eq: [ '$$post.user', userId ] }
                  }
                }
              }
            }, {
              $sort: {
                'posts.createDate': -1
              }
            }, {
              $limit: 10
            }]).toArray((err, docs) => {
              if (err) {
                result.recentActivities = null
              } else {
                result.recentActivities = docs
              }
              res.send(result);
            })
          }
        })
      }
    });
  }
}

/**
 * 查询符合用户名/主力设备的用户信息
 * /api/v1/members?name=<name>
 * /api/v1/members?device=<device>
 * @param {Request} req 
 * @param {Response} res 
 */
function getMemberInfoGeneric(req, res) {
  let query = {};
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page) || 0;

  if (req.query.name) {
    query.username = req.query.name;
  } else if (req.query.device) {
    query.device = req.query.device;
  } else {
    res.status(400).send({
      status: 'err',
      message: 'name or device is required.'
    });
    return;
  }

  MongoClient.connect(config.database, (err, db) => {
    if (err) {
      console.error(err);
      res.status(500).send({
        status: 'error',
        message: 'server side database error.'
      });
    } else {
      db.collection('common_member').find(query, {
        limit: pagesize,
        skip: offset * pagesize,
        sort: [['date', 'desc']]
      }).toArray((err, results) => {
        if (err) {
          res.status(500).send({
            status: 'error',
            message: 'server side database error.'
          });
        } else {
          res.send({
            status: 'ok',
            list: results
          });
        }
      })
    }
  })
}

module.exports = {
  handlers: [
    {
      path: '/member/:id',
      get: getMemberInfoById,
    }, {
      path: '/members',
      get: getMemberInfoGeneric,
    }
  ]
}
