'use strict';

const strPossible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const haxPossible = 'abcdef0123456789';

/**
 * 构建一个随机字符串
 *
 * @param {Number} length 字符串长度
 */
function createRandomString (length = 10, flag = {}) {
  let possible = strPossible;
  if (flag.hax) possible = haxPossible;
  return Array(length).fill(0).map(i => possible.charAt(Math.floor(possible.length * Math.random()))).join('');
}

module.exports = createRandomString;
