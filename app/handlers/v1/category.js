'use strict';

const config = require('../../../config');
const dbTool = require('../../../database');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;

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
let getCategories = async (req, res, next) => {
  try {
    // 鉴权 能否读取白名单中的分类名称
    if (!await utils.permission.checkPermission('category-readCategoriesNameInWhiteList', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }

    let categoryDoc = await dbTool.generic.findOne({ key: 'pinned-categories' });
    let categoryGroup = categoryDoc.groups;
    // 鉴权 能否读取所有分类名称
    if (!await utils.permission.checkPermission('category-readExtraCategoriesName', req.member.permissions)) {
      for (let group of categoryGroup) {
        group.items = group.items.filter(category => config.discussion.category.whiteList.includes(category.name));
      }
    }
    return res.status(200).send({ status: 'ok', groups: categoryGroup });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

// router.get('/', validation(dataInterface.category.getCategoryList), getCategories);

module.exports = {
  getCategories,
};
