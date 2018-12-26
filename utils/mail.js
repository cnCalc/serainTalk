'use strict';

const staticConfig = require('../config/staticConfig');
const env = require('./env');

const mail = env.isProd ? require('nodemailer').createTransport({
  port: staticConfig.mail.port,
  host: staticConfig.mail.host,
  auth: {
    type: staticConfig.mail.auth.type,
    user: staticConfig.mail.auth.user,
    pass: staticConfig.mail.auth.password,
  },
}) : null;

/**
 * 发送验证码到指定邮箱
 *
 * @param {string} address 邮箱地址
 * @param {string} token 验证码
 * @param {string} link 后续操作链接
 */
let sendVerificationCode = async (address, { token, link }) => {
  const html = [
    '亲爱的用户：<br />',
    '<br />',
    `您正在进行邮箱验证，本次请求的验证码为 <code>${token}</code>，十五分钟内有效。<br />`,
    link ? `如果您关闭了标签，您可以从<a href="${link}">此处</a>继续上次的操作。<br />` : '',
    '<br />',
    'cnCalc Team',
  ].join('');

  env.isProd && mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: '您的 cnCalc 验证码',
    html,
    text: html,
  });
  if (!env.isMocha) {
    console.log(html);
  }
};

let sendMessage = async (address, message) => {
  env.isProd && mail.sendMail({
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
