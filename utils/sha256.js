const crypto = require('crypto');

/**
 * 计算一短文本的的 SHA256 校验和
 *
 * @param {String} text
 */
function SHA256 (text) {
  return crypto.createHash('sha256').update(text, 'utf-8').digest('hex');
}

module.exports = SHA256;
