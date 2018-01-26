'use strict';

const staticConfig = require('../config/staticConfig');
const mail = require('nodemailer').createTransport({
  port: staticConfig.mail.port,
  host: staticConfig.mail.host,
  auth: {
    type: staticConfig.mail.auth.type,
    user: staticConfig.mail.auth.user,
    pass: staticConfig.mail.auth.password,
  },
});

/**
 * 发送验证码到指定邮箱
 *
 * @param {string} address 邮箱地址
 * @param {string} code 验证码
 */
let sendVerificationCode = async (address, code) => {
  mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: message.subject,
    text: message.text,
  });
  console.log(`Sending ${code} to ${address}`);
};

let sendMessage = async (address, message) => {
  mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: message.subject,
    text: message.text,
  });
  console.log(`Sending ${message} to ${address}`);
};

module.exports = {
  sendVerificationCode,
  sendMessage,
};
