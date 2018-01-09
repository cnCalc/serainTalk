module.exports = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  siteAddress: 'https://www.cncalc.org', // 末尾不要加'/'
  cookie: {
    renewTime: 86400000
  },
  password: {
    resetPasswordPage: 'https://www.cncalc.org/resetpassword.html',
    tokenValidTime: 1000 * 60 // 迁移或重置密码的 Token 有效期（1分钟）
  },
  member: {
    privateField: [
      'credentials',
      'notifications'
    ],
    permissions: 'loading',
    types: 'loading'
  },
  discussion: {
    category: {
      whiteList: 'loading'
    },
    post: {
      vote: [
        'up',
        'down',
        'laugh',
        'doubt',
        'cheer',
        'emmmm'
      ]
    },
    status: {
      ok: 'ok',
      deleted: 'deleted',
    },
    freqLimit: 1000 * 3 * 60, // 发帖间隔（3分钟）
    reset: 'loading',
    text: {
      delete: '您发布的内容已被封禁。',
      recover: '您被封禁的内容已恢复。',
    }
  },
  permissions: 'loading',
  notification: {
    discussionReplied: {
      content: '${var1} 回复了您创建的讨论：${var2}',
      href: '/d/${var1}/${var2}#index-${var3}'
    },
    postReplied: {
      content: '${var1} 回复了您：${var2}',
      href: '/d/${var1}/${var2}#index-${var3}'
    },
  },
};
