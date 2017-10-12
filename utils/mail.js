'use strict';

/**
 * 发送验证码到指定邮箱
 *
 * @param {string} address 邮箱地址
 * @param {string} code 验证码
 */
let sendVerificationCode = (address, code) => {
  console.log(`Sending ${code} to ${address}`);
};

module.exports = {
  sendVerificationCode
};
