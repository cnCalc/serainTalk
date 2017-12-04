const crypto = require('crypto');

/**
 * 计算一短文本的的 MD5 校验和
 *
 * @param {String} text
 */
function MD5 (text) {
  return crypto.createHash('md5').update(text, 'utf-8').digest('hex');
}

module.exports = MD5;
