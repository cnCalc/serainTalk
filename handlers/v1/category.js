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
let flushCache = async () => {
  let doc = await dbTool.generic.findOne({ key: 'pinned-categories' });
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
};

/**
 * 将分区的 slug 转化为完整的分区名
 * @param {String} slug
 * @param {Function} callback
 */
let slugToCategory = async (slug) => {
  if (slugCache[slug]) {
    // 缓存命中，直接调用 callback 返回结果
    return slugCache[slug];
  } else {
    // 刷新缓存
    await flushCache();
    return slugCache[slug];
  }
};

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
let getCategoryList = async (req, res, next) => {
  try {
    let doc = await dbTool.generic.findOne({ key: 'pinned-categories' });
    return res.status(200).send({ status: 'ok', groups: doc.groups });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * 获得指定分区下的所有讨论
 * /api/v1/category/:slug/discussions
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionsUnderSpecifiedCategory = async (req, res, next) => {
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;

  try {
    let category = await slugToCategory(req.params.slug);
    /* istanbul ignore if */
    if (typeof category === 'undefined') {
      return res.status(200).send({ status: 'ok' });
    }

    let discussions = await dbTool.discussion.find(
      { category: category },
      { creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1, tags: 1, status: 1, lastMember: 1, replies: 1, },
      {
        limit: pagesize,
        skip: offset * pagesize,
        sort: [['lastDate', 'desc']]
      }
    ).toArray();

    let members = await resloveMembersInDiscussionArray(discussions);
    return res.send({ status: 'ok', discussions: discussions, members: members });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

router.get('/', getCategoryList);
router.get('/:slug/discussions', getDiscussionsUnderSpecifiedCategory);

module.exports = router;
