'use strict';

/**
 * 构建 RESTful 的 url
 *
 * @param {string} url 基础链接
 * @param {object} params 参数
 */
let createRESTfulUrl = (url, params) => {
  url += '?';
  Object.keys(params).forEach(key => {
    url += `${key}=${params[key]}&`;
  });
  url = url.slice(0, -1);
  url = encodeURI(url);
  return url;
};

module.exports = {
  createRESTfulUrl
};
