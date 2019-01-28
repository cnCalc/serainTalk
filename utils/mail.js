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
  const html = `<p>亲爱的用户：</p>
  <p>您正在进行邮箱验证，本次请求的验证码为&nbsp;<code>${token}</code>&nbsp;，十五分钟内有效。</p>`
  + (link ? `<p>您也可以点击下面的链接继续之前的操作：</p>
    <p><a href="${link}" target="_blank">${link}</a></p>` : '') +
  +`<p>这是一封自动发送的邮件，请不要直接回复。如果这个请求不是由你发起的，那没问题，你不用担心，你可以安全地忽略这封邮件。</p>
  <p>cnCalc Team</p>`;

  env.isProd && mail.sendMail({
    from: 'cnCalc 计算器论坛 <notification@cncalc.org>',
    to: address,
    subject: '您的 cnCalc 验证码',
    html,
  });
  if (!env.isMocha) {
    console.log(html);
  }
};

let sendSubscriptionUpdateNotification = async (address, { title, link, content }) => {
  const html = [
    '亲爱的用户：<br />',
    '<br />',
    '您订阅的讨论「${title}」有新的动态：<br />',
    '<div style="border: 1px solid #AAAAAA; padding: 1em; margin: 1em">' + content + '</div>',
    '您可以通过下面的链接来查看完整讨论：<br />',
    '<br />',
    '<del>此处应有链接</del>',
    '<br />',
    'cnCalc Team',
  ].join('');

  env.isProd && mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: `您订阅的讨论「${title}」有新的动态`,
    html,
  });
  if (!env.isMocha) {
    console.log(html);
  }
};

let sendDiscussionReplyNotification = async (address, { title, link, content }) => {
  const html = [
    '亲爱的用户：<br />',
    '<br />',
    '您创建的讨论「${title}」有新的回复：<br />',
    '<div style="border: 1px solid #AAAAAA; padding: 1em; margin: 1em">' + content + '</div>',
    '您可以通过下面的链接来查看完整讨论：<br />',
    '<br />',
    '<del>此处应有链接</del>',
    '<br />',
    'cnCalc Team',
  ].join('');

  env.isProd && mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: `您创建的讨论「${title}」有新的回复`,
    html,
  });
  if (!env.isMocha) {
    console.log(html);
  }
};

let sendMentionNotification = async (address, { title, link, content }) => {
  const html = [
    '亲爱的用户：<br />',
    '<br />',
    '您在讨论「${title}」中被提及：<br />',
    '<div style="border: 1px solid #AAAAAA; padding: 1em; margin: 1em">' + content + '</div>',
    '您可以通过下面的链接来查看完整讨论：<br />',
    '<br />',
    '<del>此处应有链接</del>',
    '<br />',
    'cnCalc Team',
  ].join('');

  env.isProd && mail.sendMail({
    from: staticConfig.mail.data.from,
    to: address,
    subject: `您在讨论「${title}」中被提及`,
    html,
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
  mail,
  sendVerificationCode,
  sendSubscriptionUpdateNotification,
  sendDiscussionReplyNotification,
  sendMentionNotification,
  sendMessage,
};
