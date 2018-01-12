'use strict';

exports = module.exports = {};

/**
 * 用指定参数填充模板字符串
 * 模板内容不会被修改
 *
 * @param {string} template 模板
 * @param {any} params 参数
 * @returns {string} 填充后的字符串
 *
 * example：
 * let template = 'hello ${var1}';
 * let value = { var1: 'world' };
 * fillTemplate(template, value) // hello world;
 */
const fillTemplate = (template, params) => {
  if (!template) throw new Error('template can\'t be empty.');
  let tempStr = template;
  for (let key of Object.keys(params)) {
    tempStr = tempStr.replace(`$\{${key}\}`, params[key]);
  }
  return tempStr;
};

exports.fillTemplate = fillTemplate;

