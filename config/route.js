'use strict';

const dataInterface = require('../app/dataInterface');
const handlers = require('../app/handlers');
const utils = require('../utils');
const { verifyCommitFreq, verifyMember } = require('../app/middleware/permission');

let route = {
  discussion: {
    getLatest: {
      description: '获取最新的讨论。',
      path: [
        '/v1/discussions/latest',
        '/v1/discussion/latest',
      ],
      method: 'get',
      schema: dataInterface.discussion.getLatestList,
      handler: [
        handlers.v1.discussion.getLatestDiscussionList,
      ],
    },
    getByDiscussionId: {
      description: '根据讨论 ID 获取讨论摘要。',
      path: [
        '/v1/discussions/:id',
        '/v1/discussion/:id',
      ],
      method: 'get',
      schema: dataInterface.discussion.getDiscussionById,
      handler: [
        handlers.v1.discussion.getDiscussionById,
      ],
    },
    getByMemberId: {
      description: '获取指定成员创建的 Discussion。',
      path: [
        '/v1/members/:id/discussions',
        '/v1/member/:id/discussions',
      ],
      method: 'get',
      schema: dataInterface.discussion.getDiscussionByMember,
      handler: [
        handlers.v1.discussion.getDiscussionUnderMember,
      ],
    },
    getByCategory: {
      description: '获取指定分类下的 Discussion。',
      path: [
        '/v1/categories/:slug/discussions',
        '/v1/category/:slug/discussions',
      ],
      method: 'get',
      schema: dataInterface.discussion.getDiscussionsByCategory,
      handler: [
        handlers.v1.discussion.getDiscussionsByCategory,
      ],
    },
    addOne: {
      description: '新发布一个 Discussion。',
      path: [
        '/v1/discussions',
        '/v1/discussion',
      ],
      method: 'post',
      schema: dataInterface.discussion.createDiscussion,
      handler: [
        verifyMember,
        verifyCommitFreq,
        handlers.v1.discussion.createDiscussion,
      ],
    },
    delete: {
      description: '封禁/解封 指定的 Discussion。',
      path: [
        '/v1/discussions/:id',
        '/v1/discussion/:id',
      ],
      method: 'delete',
      schema: dataInterface.discussion.banDiscussion,
      handler: [
        handlers.v1.discussion.deleteDiscussion,
      ],
    },
    ignoreDiscussion: {
      description: '拒收指定 Discussion 的被回复通知。',
      path: [
        '/v1/discussions/:id/ignore',
        '/v1/discussion/:id/ignore',
      ],
      method: 'post',
      schema: dataInterface.discussion.ignoreDiscussion,
      handler: [
        handlers.v1.discussion.ignoreDiscussion,
      ],
    },
    watchDiscussion: {
      description: 'watch 指定的 Discussion。',
      path: [
        '/v1/discussions/:id/watch',
        '/v1/discussion/:id/watch',
      ],
      method: 'post',
      schema: dataInterface.discussion.watchDiscussion,
      handler: [
        handlers.v1.discussion.watchDiscussion,
      ],
    },
    normalDiscussion: {
      description: '将指定 Discussion 的通知设为默认。',
      path: [
        '/v1/discussions/:id/normal',
        '/v1/discussion/:id/normal',
      ],
      method: 'post',
      schema: dataInterface.discussion.normalDiscussion,
      handler: [
        handlers.v1.discussion.normalDiscussion,
      ],
    },
    ignoreMember: {
      description: '拒收指定 member 的回复通知。',
      path: [
        '/v1/member/:id/ignore',
        '/v1/member/:id/ignore',
      ],
      method: 'post',
      schema: dataInterface.discussion.ignoreMember,
      handler: [
        handlers.v1.discussion.ignoreMember,
      ],
    },
    lock: {
      description: '锁定/解锁 指定的 Discussion。',
      path: [
        '/v1/discussions/:id/lock',
        '/v1/discussion/:id/lock',
      ],
      method: 'post',
      schema: dataInterface.discussion.lockDiscussion,
      handler: [
        handlers.v1.discussion.lockDiscussion,
      ],
    },
  },
  posts: {
    getByDiscussionId: {
      description: '获取指定 Discussion 下的 Post。',
      path: [
        '/v1/discussions/:id/posts',
        '/v1/discussion/:id/posts',
      ],
      method: 'get',
      schema: dataInterface.discussion.getPostsById,
      handler: [
        handlers.v1.discussion.getDiscussionPostsById,
      ],
    },
    getByIndex: {
      description: '获取指定 Discussion 下指定楼层的 Post。',
      path: [
        '/v1/discussions/:id/post/:postIndex',
        '/v1/discussion/:id/post/:postIndex',
      ],
      method: 'get',
      schema: dataInterface.discussion.getPostByIndex,
      handler: [
        handlers.v1.discussion.getPostByIndex,
      ],
    },
    addOne: {
      description: '在指定 Discussion 下追加一个 Post。',
      path: [
        '/v1/discussions/:id/post',
        '/v1/discussion/:id/post',
      ],
      method: 'post',
      schema: dataInterface.discussion.createPost,
      handler: [
        verifyCommitFreq,
        handlers.v1.discussion.createPost,
      ],
    },
    updateOne: {
      description: '修改指定 Discussion 下指定楼层的 Post。',
      path: [
        '/v1/discussions/:id/post/:postIndex',
        '/v1/discussion/:id/post/:postIndex',
      ],
      method: 'put',
      schema: dataInterface.discussion.updatePost,
      handler: [
        handlers.v1.discussion.updatePost,
      ],
    },
    delete: {
      description: '封禁/解封 指定的 Post。',
      path: [
        '/v1/discussions/:id/post/:postIndex',
        '/v1/discussion/:id/post/:postIndex',
      ],
      method: 'delete',
      schema: dataInterface.discussion.deletePost,
      handler: [
        handlers.v1.discussion.deletePost,
      ],
    },
  },
  vote: {
    addOne: {
      description: '为指定 Post 添加一个 vote。',
      path: [
        '/v1/discussions/:id/post/:postIndex/vote',
        '/v1/discussion/:id/post/:postIndex/vote',
      ],
      method: 'post',
      schema: dataInterface.discussion.votePost,
      handler: [
        verifyMember,
        handlers.v1.discussion.votePost,
      ],
    },
  },
  member: {
    getSelf: {
      description: '获取自己的信息。',
      path: [
        '/v1/members/me',
        '/v1/member/me',
      ],
      method: 'get',
      schema: dataInterface.member.info.me,
      handler: [
        verifyMember,
        handlers.v1.member.getSelf,
      ],
    },
    getById: {
      description: '获取指定 Id 下成员的信息。',
      path: [
        '/v1/members/:id',
        '/v1/member/:id',
      ],
      method: 'get',
      schema: dataInterface.member.info.getById,
      handler: [
        handlers.v1.member.getMemberInfoById,
      ],
    },
    genericGet: {
      description: '通用获取成员的信息接口，目前支持 设备/姓名。',
      path: [
        '/v1/members',
        '/v1/member',
      ],
      method: 'get',
      schema: dataInterface.member.info.get,
      handler: [
        handlers.v1.member.getMemberInfoGeneric,
      ],
    },
    startWith: {
      description: '通用获取成员的信息接口，目前支持 设备/姓名。',
      path: [
        '/v1/members/startwith/:subName',
      ],
      method: 'get',
      schema: dataInterface.member.info.startWith,
      handler: [
        handlers.v1.member.memberStartWith,
      ],
    },
    // addOne: {
    //   description: '新成员注册。',
    //   path: [
    //     '/v1/members/signup',
    //     '/v1/member/signup',
    //   ],
    //   method: 'post',
    //   schema: dataInterface.member.signup,
    //   handler: [
    //     handlers.v1.member.signup,
    //   ],
    // },
    prepareAddOne: {
      description: '新用户注册之邮箱验证',
      path: [
        '/v1/members/signup/prepare',
        '/v1/member/signup/prepare',
      ],
      method: 'post',
      schema: dataInterface.member.prepareSignup,
      handler: [
        handlers.v1.member.prepareSignup,
      ],
    },
    performAddOne: {
      description: '新用户注册之执行注册',
      path: [
        '/v1/members/signup/perform',
        '/v1/member/signup/perform',
      ],
      method: 'post',
      schema: dataInterface.member.performSignup,
      handler: [
        handlers.v1.member.performSignup,
      ],
    },
    login: {
      description: '成员登录。',
      path: [
        '/v1/members/login',
        '/v1/member/login',
      ],
      method: 'post',
      schema: dataInterface.member.login,
      handler: [
        handlers.v1.member.login,
      ],
    },
    setting: {
      description: '修改用户设置。',
      path: [
        /\/v1\/members{0,1}\/settings{0,1}\/(.*)/,
        /\/v1\/members{0,1}\/settings{0,1}/,
      ],
      method: 'put',
      schema: dataInterface.member.setting,
      handler: [
        verifyMember,
        handlers.v1.member.updateSettings,
      ],
    },
    logout: {
      description: '注销。',
      path: [
        '/v1/members/login',
        '/v1/member/login',
      ],
      method: 'delete',
      schema: dataInterface.member.logout,
      handler: [
        verifyMember,
        handlers.v1.member.logout,
      ],
    },
    uploadAvatar: {
      description: '上传头像。',
      path: [
        '/v1/member/avatar',
      ],
      method: 'post',
      schema: dataInterface.member.info.uploadAvatar,
      handler: [
        verifyMember,
        utils.upload.avatarUpload.single('avatar'),
        handlers.v1.member.uploadAvatar,
      ],
    },
    updateSelf: {
      description: '修改用户信息。',
      path: [
        '/v1/member',
      ],
      method: 'put',
      schema: dataInterface.member.info.update,
      handler: [
        verifyMember,
        handlers.v1.member.updateMemberInfo,
      ],
    },
    verifyEmail: {
      description: '验证用户邮箱。',
      path: [
        '/v1/member/email/verify',
      ],
      method: 'post',
      schema: dataInterface.member.info.verifyEmail,
      handler: [
        verifyMember,
        handlers.v1.member.verifyEmail,
      ],
    },
    updateEmail: {
      description: '更换用户邮箱。',
      path: [
        '/v1/member/email',
      ],
      method: 'put',
      schema: dataInterface.member.info.updateEmail,
      handler: [
        verifyMember,
        handlers.v1.member.updateEmail,
      ],
    },
  },
  password: {
    applicationReset: {
      description: '申请重置密码。',
      path: [
        '/v1/members/password/reset/application',
        '/v1/member/password/reset/application',
      ],
      method: 'post',
      schema: dataInterface.member.password.resetApplication,
      handler: [
        handlers.v1.member.resetPasswordApplication,
      ],
    },
    reset: {
      description: '重置密码。',
      path: [
        '/v1/members/password/reset',
        '/v1/member/password/reset',
      ],
      method: 'post',
      schema: dataInterface.member.password.reset,
      handler: [
        handlers.v1.member.resetPassword,
      ],
    },
    updateOne: {
      description: '更新密码。',
      path: [
        '/v1/members/password',
        '/v1/member/password',
      ],
      method: 'put',
      schema: dataInterface.member.password.modify,
      handler: [
        verifyMember,
        handlers.v1.member.passwordModify,
      ],
    },
  },
  message: {
    getByMember: {
      description: '获取与指定成员的私信。',
      path: [
        '/v1/message/member/:memberId',
        '/v1/messages/member/:memberId',
      ],
      method: 'get',
      schema: dataInterface.message.getMessageByMemberId,
      handler: [
        verifyMember,
        handlers.v1.message.getMessageByMemberId,
      ],
    },
    getById: {
      description: '获取指定的私信。',
      path: [
        '/v1/message/:id',
        '/v1/messages/:id',
      ],
      method: 'get',
      schema: dataInterface.message.getMessageById,
      handler: [
        verifyMember,
        handlers.v1.message.getMessageById,
      ],
    },
    getInfos: {
      description: '获取自己的私信摘要列表。',
      path: [
        '/v1/message',
        '/v1/messages',
      ],
      method: 'get',
      schema: dataInterface.message.getMessagesInfo,
      handler: [
        verifyMember,
        handlers.v1.message.getMessagesInfo,
      ],
    },
    sendOne: {
      description: '发送一条私信给指定成员。',
      path: [
        '/v1/message/:memberId',
        '/v1/messages/:memberId',
      ],
      method: 'post',
      schema: dataInterface.message.sendMessage,
      handler: [
        verifyMember,
        handlers.v1.message.sendMessage,
      ],
    },
  },
  notification: {
    getSelf: {
      description: '获取自己的通知。',
      path: [
        '/v1/notification',
        '/v1/notifications',
      ],
      method: 'get',
      schema: dataInterface.notification.getNotification,
      handler: [
        verifyMember,
        handlers.v1.notification.getNotification,
      ],
    },
    // 路径存在风险 readAll 需要在 readOne 前面
    readAll: {
      description: '已读所有通知。',
      path: [
        '/v1/notification/all/read',
        '/v1/notifications/all/read',
      ],
      method: 'post',
      schema: dataInterface.notification.readAllNotification,
      handler: [
        verifyMember,
        handlers.v1.notification.readAllNotification,
      ],
    },
    readOne: {
      description: '已读一条通知。',
      path: [
        '/v1/notification/:index/read',
        '/v1/notifications/:index/read',
      ],
      method: 'post',
      schema: dataInterface.notification.readNotification,
      handler: [
        verifyMember,
        handlers.v1.notification.readNotification,
      ],
    },
  },
  tag: {
    getAll: {
      description: '获取所有 Tag。',
      path: [
        '/v1/tags',
        '/v1/tag',
      ],
      method: 'get',
      schema: dataInterface.tags.getAll,
      handler: [
        handlers.v1.tags.getAllTags,
      ],
    },
    getPinned: {
      description: '获取固定的 Tag。',
      path: [
        '/v1/tags/pinned',
        '/v1/tag/pinned',
      ],
      method: 'get',
      schema: dataInterface.tags.getPinned,
      handler: [
        handlers.v1.tags.getPinnedTags,
      ],
    },
  },
  category: {
    getAll: {
      description: '获取所有 Category。',
      path: [
        '/v1/category',
        '/v1/categories',
      ],
      method: 'get',
      schema: dataInterface.category.getCategories,
      handler: [
        handlers.v1.category.getCategories,
      ],
    },
  },
  migration: {
    verify: {
      description: '验证 Discuz 用户的信息。',
      path: [
        '/v1/migration/verify',
      ],
      method: 'post',
      schema: dataInterface.migration.verify,
      handler: [
        handlers.v1.migration.verifyDiscuzMemberInfo,
      ],
    },
    perform: {
      description: '执行迁移。',
      path: [
        '/v1/migration/perform',
      ],
      method: 'post',
      schema: dataInterface.migration.perform,
      handler: [
        handlers.v1.migration.performMigration,
      ],
    },
  },
  attachment: {
    getInfoByAttachmentId: {
      description: '获取 Discuz 兼容的附件信息。',
      path: [
        '/v1/attachment/info',
      ],
      method: 'get',
      schema: dataInterface.attachment.getAttachmentByAttachmentId,
      handler: [
        handlers.v1.attachment.getAttachmentInfoByAttachmentId,
      ],
    },
    getInfoByMemberId: {
      description: '获取自己上传的所有附件的信息。',
      path: [
        '/v1/attachment/info/me',
      ],
      method: 'get',
      schema: dataInterface.attachment.getAttachmentsByMemberId,
      handler: [
        verifyMember,
        handlers.v1.attachment.getAttachmentsInfoByMemberId,
      ],
    },
    getDailyTraffic: {
      description: '获取每日流量上限。',
      path: [
        '/v1/attachment/traffic',
      ],
      method: 'get',
      schema: dataInterface.attachment.getDailyTraffic,
      handler: [
        handlers.v1.attachment.getDailyTraffic,
      ],
    },
    getById: {
      description: '获取指定附件。',
      path: [
        '/v1/attachment/:id',
      ],
      method: 'get',
      schema: dataInterface.attachment.getAttachmentById,
      handler: [
        handlers.v1.attachment.getAttachment,
      ],
    },
    uploadOne: {
      description: '上传一个文件。',
      path: [
        '/v1/attachment',
      ],
      method: 'post',
      schema: dataInterface.attachment.uploadFile,
      handler: [
        verifyMember,
        utils.upload.fileUpload.single('file'),
        handlers.v1.attachment.uploadAttachment,
      ],
    },
    delete: {
      description: '移除一个文件。',
      path: [
        '/v1/attachment/:id',
      ],
      method: 'delete',
      schema: dataInterface.attachment.deleteFile,
      handler: [
        verifyMember,
        handlers.v1.attachment.deleteAttachment,
      ],
    },
  },
  api: {
    list: {
      description: '获取接口列表。',
      path: [
        '/v1/api/ls',
        '/v1/api/list',
      ],
      method: 'get',
      schema: dataInterface.api.getAttachment,
      handler: [
        handlers.v1.api.listApi,
      ],
    },
  },
  picture: {
    uploadOne: {
      description: '上传一张图片。',
      path: [
        '/v1/picture',
      ],
      method: 'post',
      schema: dataInterface.picture.uploadPicture,
      handler: [
        verifyMember,
        utils.upload.pictureUpload.single('picture'),
        handlers.v1.picture.uploadPicture,
      ],
    },
  },
};

let devRoute = {
  debug: {
    sudo: {
      description: '临时提升至管理员权限直到注销。',
      path: [
        '/v1/debug/sudo',
      ],
      method: 'get',
      schema: dataInterface.debug.sudo,
      handler: [
        handlers.v1.debug.sudo,
      ],
    },
    sendNotification: {
      description: '发送一条通知给指定用户。',
      path: [
        '/v1/debug/notification/:id',
      ],
      method: 'get',
      schema: dataInterface.debug.sendNotification,
      handler: [
        handlers.v1.debug.sendNotification,
      ],
    },
    isAdmin: {
      description: '查看自己的身份。',
      path: [
        '/v1/debug/isadmin',
      ],
      method: 'get',
      schema: dataInterface.debug.isAdmin,
      handler: [
        handlers.v1.debug.isAdmin,
      ],
    },
  },
};

// TODO: 这块需要小心。这里不会被测试覆盖到
if (utils.env.isDev || !utils.env.isRelease) {
  Object.assign(route, devRoute);
}

module.exports = route;
