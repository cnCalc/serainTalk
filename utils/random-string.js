/**
 * 构建一个随机字符串
 *
 * @param {Number} length 字符串长度
 */
function createRandomString (length = 10) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array(length).fill(0).map(i => possible.charAt(Math.floor(possible.length * Math.random()))).join('');
}

module.exports = createRandomString;
