'use strict';

/**
 * 发送验证码到指定邮箱
 *
 * @param {string} address 邮箱地址
 * @param {string} code 验证码
 */
let sendVerificationCode = async (address, code) => {
  console.log(`Sending ${code} to ${address}`);
};

let sendMessage = async (address, message) => {
  console.log(`Sending ${message} to ${address}`);
};

module.exports = {
  sendVerificationCode,
  sendMessage,
};
