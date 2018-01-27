'use strict';

const staticConfig = require('../config/staticConfig');
const env = require('./env');

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
  env.isProd && mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: '您的 cnCalc 验证码',
    html: `亲爱的用户：<br>您正在进行邮箱验证，本次请求的验证码为 <code>${code}</code>，十五分钟内有效。<br><br>cnCalc Team`,
    text: `亲爱的用户：\n您正在进行邮箱验证，本次请求的验证码为 ${code}，十五分钟内有效。\n\ncnCalc Team`,
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
