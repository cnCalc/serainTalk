'use strict';

const path = require('path');

module.exports = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  siteAddress: 'https://next.cncalc.org', // 末尾不要加'/'
  cookie: {
    renewTime: 86400000,
  },
  password: {
    resetPasswordPage: 'https://www.cncalc.org/resetpassword.html',
    tokenValidTime: 1000 * 60 * 15, // 迁移或重置密码的 Token 有效期（15 分钟）
  },
  member: {
    privateField: [
      'credentials', // 身份信息，只有服务器端留存，不可获取
      'notifications', // 有专用接口，不直接获取
      'ignores', // 服务器端留存即可，无需发送
    ],
    protectedField: [
    ],
    permissions: 'loading',
    types: 'loading',
  },
  discussion: {
    category: {
      whiteList: 'loading',
    },
    post: {
      vote: [
        'up',
        'down',
      ],
      votePerResolveNumber: 5, // 每种 vote 解析的人数
    },
    status: {
      ok: 'ok',
      deleted: 'deleted',
    },
    freqLimit: 1000 * 3 * 60, // 发帖间隔（3分钟）
    reset: 'loading',
    text: {
      delete: '您发布的内容已被删除。',
      recover: '您被删除的内容已恢复。',
    },
  },
  permissions: 'loading',
  notification: {
    discussionReplied: {
      content: '${var1} 回复了您创建的讨论：${var2}',
      href: '/d/${var1}/${var2}#index-${var3}',
    },
    postReplied: {
      content: '${var1} 回复了您：${var2}',
      href: '/d/${var1}/${var2}#index-${var3}',
    },
    postMentioned: {
      content: '${var1} 在讨论 ${var2} 中提及了你',
      href: '/d/${var1}/${var2}#index-${var3}',
    },
    discussionDeleted: {
      content: '您发布的讨论: ${title} 已被删除。',
    },
    discussionRecover: {
      content: '您被删除的讨论: ${title} 已恢复。',
    },
    postDeleted: {
      content: '您在讨论 ${title} 中发布的跟帖: ${content} 已被删除。',
    },
    postRecover: {
      content: '您在讨论 ${title} 中被删除的跟帖: ${content} 已恢复。',
    },
  },
  upload: {
    file: {
      maxCount: 20, // 每个成员最多能上传的附件数量
      path: path.join(__dirname, '..', 'uploads/attachment/forum'),
      maxAge: '7d',
      maxSize: 1000 * 1000 * 100, // 100MB
      maxDownload: 1000 * 1000 * 1000 * 20, // 20GB
    },
    picture: {
      path: path.join(__dirname, '..', 'uploads/attachment/forum'),
      maxSize: 1000 * 1000 * 100, // 100MB
    },
    avatar: {
      path: path.join(__dirname, '..', 'uploads', 'avatars'),
      maxSize: 1000 * 1000 * 100, // 100MB
    },
    key: {
      image: 'picture',
      avatar: 'avatar',
      file: 'file',
    },
  },
  frontEnd: {
    filePath: path.join(__dirname, '..', 'app', 'public'),
  },
  mail: {
    code: {

    },
    data: {
      from: 'zephray@cnvintage.org',
    },
    port: 465,
    host: 'smtp.sendgrid.net',
    secure: true,
    auth: {
      type: 'login',
      user: 'apikey',
      password: 'deleted',
    },
  },
  device: [
    'DEVICE_NSPIRE_CLICKPAD',
    'DEVICE_NSPIRE_TOUCHPAD',
    'DEVICE_NSPIRE_CX',
    'DEVICE_NSPIRE_CM',
    'DEVICE_TI_83_84',
    'DEVICE_TI_89',
    'DEVICE_TI_92',
    'DEVICE_TI_92_PLUS',
    'DEVICE_CLASSPAD_330',
    'DEVICE_CLASSPAD_400',
    'DEVICE_FX_9860',
    'DEVICE_FX_9750',
    'DEVICE_FX_CG10_20',
    'DEVICE_FX_CG50',
    'DEVICE_FX_5800P',
    'DEVICE_HP_39GS',
    'DEVICE_HP_50G',
    'DEVICE_HP_PRIME',
    'DEVICE_SCIENTIFIC',
    'DEVICE_KEYSTROKE',
    'DEVICE_OTHER',
  ],
};
