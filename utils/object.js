'use strict';

exports = module.exports = {};

/**
 * 移除对象中的空字段（undefined/null）
 *
 * @param {any} item
 * @returns {any} 移除了所有空键的对象
 */
let removeUndefined = (item) => {
  let tempItem = {};
  Object.keys(item)
    .filter(key => item[key] !== undefined && item[key] !== null)
    .forEach(key => { tempItem[key] = item[key]; });
  return tempItem;
};
exports.removeUndefined = removeUndefined;
