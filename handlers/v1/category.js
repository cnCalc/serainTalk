'use strict';

const config = require('../../config');
const { resloveMembersInDiscussionArray } = require('../../utils/resolve-members');
const errorHandler = require('../../utils/error-handler');
const errorMessages = require('../../utils/error-messages');
const dbTool = require('../../utils/database');
const express = require('express');
const router = express.Router();

/**
 * 缓存保存对象
 */
let slugCache = {};

/**
 * 刷新内存里的 slug 缓存
 * @param {Function} callback
 */
function flushCache (callback) {
  dbTool.db.collection('generic').findOne({ key: 'pinned-categories' }).then(doc => {
    let cache = {};
    // 遍历保存
    for (let group of doc.groups) {
      for (let item of group.items) {
        if (item.type === 'category') {
          cache[item.slug] = item.name;
        }
      }
    }
    slugCache = cache;
    callback(null);
  }).catch(err => {
    callback(err);
  });
}

/**
 * 将分区的 slug 转化为完整的分区名
 * @param {String} slug
 * @param {Function} callback
 */
function slugToCategory (slug, callback) {
  if (slugCache[slug]) {
    // 缓存命中，直接调用 callback 返回结果
    callback(null, slugCache[slug]);
  } else {
    // 刷新缓存
    flushCache(err => {
      if (err) {
        callback(err);
      } else {
        callback(null, slugCache[slug]);
      }
    });
  }
}

// 立即刷新一次分区 slug 的缓存
// flushCache(err => {
//   if (err) {
//     console.log(err);
//     process.exit(10);
//   }
// });

/**
 * 获得所有板块和分区信息
 * /api/v1/categories
 * @param {Request} req
 * @param {Response} res
 */
function getCategoryList (req, res) {
  dbTool.db.collection('generic').findOne({ key: 'pinned-categories' }).then(doc => {
    res.send({
      status: 'ok',
      groups: doc.groups,
    });
  }).catch(err => {
    errorHandler(err, errorMessages.DB_ERROR, 500, res);
    return;
  });
}

/**
 * 获得指定分区下的所有讨论
 * /api/v1/category/:slug/discussions
 * @param {Request} req
 * @param {Response} res
 */
function getDiscussionsUnderSpecifiedCategory (req, res) {
  let pagesize = Number(req.query.pagesize) || config.pagesize;
  let offset = Number(req.query.page - 1) || 0;

  slugToCategory(req.params.slug, (err, category) => {
    if (err) {
      errorHandler(err, errorMessages.DB_ERROR, 500, res);
      return;
    } else if (typeof category === 'undefined') {
      res.send({
        status: 'ok',
      });
    } else {
      dbTool.discussion.find(
        { category },
        { creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, lastMember: 1, replies: 1, },
        {
          limit: pagesize,
          skip: offset * pagesize,
          sort: [['lastDate', 'desc']]
        }
      ).toArray((err, results) => {
        if (err) {
          errorHandler(err, errorMessages.DB_ERROR, 500, res);
          return;
        }
        resloveMembersInDiscussionArray(results).then(members => {
          return res.send({ status: 'ok', discussions: results, members });
        }).catch(err => {
          if (err) {
            /* istanbul ignore next */
            return errorHandler(err, errorMessages.DB_ERROR, 500, res);
          }
        });
      });
    }
  });
}

router.get('/', getCategoryList);
router.get('/:slug/discussions', getDiscussionsUnderSpecifiedCategory);

module.exports = router;
