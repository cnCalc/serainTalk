'use strict';

const { ObjectID } = require('mongodb');

const config = require('../../../config');
const dbTool = require('../../../database');
const _ = require('lodash');
const utils = require('../../../utils');
const { errorHandler, errorMessages } = utils;
const { resolveMembersInDiscussionArray, resolveMembersInDiscussion } = utils.resolveMembers;
const { isSelfAttachment, resolveAttachmentsInPosts } = utils.attachment;

/**
 * 缓存保存对象
 */
let slugCache = {};

// region 工具函数
/**
 * [工具函数] 刷新内存里的 slug 缓存
 * @param {Function} callback
 */
let flushCache = async () => {
  let doc = await dbTool.generic.findOne({ key: 'pinned-categories' });
  let cache = {};
  // 遍历保存
  for (let group of doc.groups) {
    for (let item of group.items) {
      if (item.type === 'category') {
        cache[item.slug] = item.name;
      }
    }
  }
  slugCache = cache;
};
/**
 * [工具函数] 将分区的 slug 转化为完整的分区名
 * @param {String} slug
 * @param {Function} callback
 */
let slugToCategory = async (slug) => {
  if (slugCache[slug]) {
    // 缓存命中，直接调用 callback 返回结果
    return slugCache[slug];
  } else {
    // 刷新缓存
    await flushCache();
    return slugCache[slug];
  }
};
// endregion

/**
 * 获取最新的讨论
 * /api/v1/discussions/latest
 * query : [tag][memberId][page][pagesize]
 * 当没有参数时，查询整站的讨论
 * 按照最新回复排序
 * @param {Request} req
 * @param {Response} res
 */
let getLatestDiscussionList = async (req, res) => {
  // 鉴权 能否读取白名单分类中的讨论
  if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;

  try {
    let query = {
      category: { $in: config.discussion.category.whiteList },
      $or: [
        { status: null },
        { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
      ],
    };
    // 无权限只显示白名单中的分类
    if (req.query.category
      // 鉴权 能否读取所有分类的讨论
      && await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      req.query.category = req.query.category.filter(
        item => config.discussion.category.whiteList.includes(item)
      );
      query.category = { $in: req.query.category };
    }
    // 检索其发出的 discussion
    if (req.query.memberId) {
      req.query._memberId = ObjectID(req.query.memberId);
      query.creater = req.query._memberId;
    }
    // 检索指定的 tag
    if (req.query.tag) query.tags = { $in: req.query.tag };

    // 鉴权 能否读取被封禁的 discussion
    if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
      delete query.$or;
    }

    let results = await dbTool.discussion.aggregate([
      { $match: query },
      {
        $project: {
          creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1,
          tags: 1, status: 1, lastMember: 1, replies: 1, category: 1,
        },
      },
      { $sort: { lastDate: -1 } },
      { $skip: offset * pagesize },
      { $limit: pagesize },
    ]).toArray();
    let members = await resolveMembersInDiscussionArray(results);
    return res.send({ status: 'ok', discussions: results, members });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * 根据 ID 获得指定讨论的信息，不包含帖子列表
 * /api/v1/discussion/:id
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionById = async (req, res) => {
  try {
    // 鉴权 能否读取白名单分类中的讨论
    if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }
    let _discussionId = ObjectID(req.params.id);
    let query = {
      _id: _discussionId,
      category: { $in: config.discussion.category.whiteList },
      $or: [
        { status: null },
        { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
      ],
    };
    // 鉴权 能否读取所有分类的讨论
    if (await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      delete query.category;
    }

    // 鉴权 能否读取被封禁的 discussion
    if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
      delete query.$or;
    }

    let discussionDoc = await dbTool.discussion.aggregate([
      { $match: query },
      {
        $project: {
          creater: 1, title: 1, createDate: 1,
          lastDate: 1, views: 1, tags: 1,
          status: 1, lastMember: 1, category: 1,
          postsCount: { $size: '$posts' },
        },
      },
    ]).toArray();
    if (discussionDoc.length === 0) return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    let count = discussionDoc[0].postsCount;
    delete discussionDoc[0].postsCount;
    return res.status(200).send({ status: 'ok', discussionInfo: discussionDoc[0], count: count });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * 根据 ID 获得指定讨论的帖子
 * /api/v1/discussion/:id/posts
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionPostsById = async (req, res) => {
  // 鉴权 能否读取白名单分类中的讨论
  if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;
  try {
    let _discussionId = ObjectID(req.params.id);
    let query = {
      _id: _discussionId,
      category: { $in: config.discussion.category.whiteList },
      $or: [
        { status: null },
        { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
      ],
    };

    // 鉴权 能否读取所有分类的讨论
    if (await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      delete query.category;
    }

    let postQuery = {
      $or: [
        { 'posts.status': null },
        { 'posts.status.type': { $in: [config.discussion.status.ok] } },
        { 'posts.user': req.member._id },  // 允许看到自己被删除的帖子
      ],
    };
    // 鉴权 能否读取被封禁的 discussion 和 post
    if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
      delete query.$or;
      delete postQuery.$or;
    }

    let discussionDoc = await dbTool.discussion.aggregate([
      { $match: query },
      {
        $project: {
          title: 1,
        },
      },
    ]).toArray();
    if (discussionDoc.length === 0) return errorHandler(null, errorMessages.NOT_FOUND, 404, res);

    let postsDoc = await dbTool.discussion.aggregate([
      { $match: query },
      { $project: { _id: 0, posts: 1 } },
      { $unwind: '$posts' },
      { $match: postQuery },
      { $skip: offset * pagesize },
      { $limit: pagesize },
    ]).toArray();

    // resolve vote 中的 memberId
    let posts = postsDoc.map(doc => {
      let post = doc.posts;
      let tempVote = {};
      for (let voteType of Object.keys(post.votes)) {
        tempVote[voteType] = {};
        tempVote[voteType]['memberId'] = _.take(post.votes[voteType], config.discussion.post.votePerResolveNumber).map(_memberId => _memberId.toString());
        tempVote[voteType]['count'] = post.votes[voteType].length;
      }
      post.votes = tempVote;
      return post;
    });
    return res.status(200).send({
      status: 'ok',
      posts: utils.renderer.renderPosts(posts),
      members: await resolveMembersInDiscussion({ posts }),
      attachments: await resolveAttachmentsInPosts(posts),
    });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let getPostByIndex = async (req, res, next) => {
  // 鉴权 能否读取白名单分类中的讨论
  if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let _discussionId = ObjectID(req.params.id);
  let query = {
    _id: _discussionId,
    category: { $in: config.discussion.category.whiteList },
    $or: [
      { status: null },
      { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
    ],
  };
  let postQuery = {
    'posts.index': req.params.postIndex,
    $or: [
      { 'posts.status': null },
      { 'posts.status.type': { $in: [config.discussion.status.ok] } },
      { 'posts.user': req.member._id },  // 允许看到自己被删除的帖子
    ],
  };
  // 鉴权 能否读取被封禁的 discussion 和 post
  if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
    delete query.$or;
    delete postQuery.$or;
  }
  // 鉴权 能否读取所有分类中的讨论
  if (await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
    delete query.category;
  }
  try {
    // 获取
    let postsDoc = await dbTool.discussion.aggregate([
      { $match: query },
      { $project: { _id: 0, posts: 1 } },
      { $unwind: '$posts' },
      { $match: postQuery },
    ]).toArray();
    if (postsDoc.length === 0) return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    let post = postsDoc[0].posts;

    let tempVote = {};
    for (let voteType of Object.keys(post.votes)) {
      tempVote[voteType] = {};
      tempVote[voteType]['memberId'] = _.take(post.votes[voteType], config.discussion.post.votePerResolveNumber).map(_memberId => _memberId.toString());
      tempVote[voteType]['count'] = post.votes[voteType].length;
    }
    post.votes = tempVote;

    return res.status(200).send({
      status: 'ok',
      post: req.query.raw ? post : (utils.renderer.renderPosts([post]))[0],
      members: await resolveMembersInDiscussion({ posts: [post] }),
      attachments: await resolveAttachmentsInPosts([post]),
    });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 创建新讨论
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let createDiscussion = async (req, res, next) => {
  // 鉴权 能否在白名单分类中发布讨论
  if (!await utils.permission.checkPermission('discussion-postToCategoryInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let now = Date.now();
  if (!config.discussion.category.whiteList.includes(req.body.category)
    // 鉴权 能否向所有的分类新增讨论
    && !await utils.permission.checkPermission('discussion-postToExtraCategory', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let emptyVote = {};
  for (let voteType of config.discussion.post.vote) emptyVote[voteType] = [];

  // 附件鉴权。是否为本人的附件。
  let _attachments = [];
  if (req.body.attachments) {
    _attachments = req.body.attachments.map(attachmentId => ObjectID(attachmentId));
  }
  if (!await isSelfAttachment(req.body.attachments.map(attachmentId => ObjectID(attachmentId)), req.member._id)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  };

  let discussionInfo = {
    _id: ObjectID(),
    category: req.body.category,
    createDate: now,
    creater: req.member._id,
    lastDate: now,
    lastMember: req.member._id,
    participants: [
      req.member._id,
    ],
    posts: [
      {
        attachments: _attachments,
        allowScript: req.member.role === 'admin',
        content: req.body.content.content,
        createDate: now,
        encoding: req.member.role === 'admin' ? req.body.content.encoding : 'markdown',
        index: 1,
        status: {
          type: config.discussion.status.ok,
        },
        user: req.member._id,
        votes: emptyVote,
      },
    ],
    replies: 1,
    status: {
      type: config.discussion.status.ok,
    },
    tags: req.body.tags,
    title: req.body.title,
    views: 0,
  };
  try {
    await dbTool.discussion.insertOne(discussionInfo);

    await dbTool.attachment.updateMany(
      { _id: { $in: _attachments } },
      {
        $push: {
          referer: {
            _discussionId: discussionInfo._id,
            index: 1,
          },
        },
      }
    );

    utils.logger.writeEventLog({
      entity: 'Discussion',
      type: 'Create',
      emitter: req.member._id,
      comments: {
        category: req.body.category,
      },
    });

    utils.websocket.broadcastEvent('Discussion', 'Create', { category: req.body.category });

    return res.status(201).send({ status: 'ok', discussion: discussionInfo });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let createPost = async (req, res, next) => {
  // 鉴权 能否在白名单分类中发布跟帖
  if (!await utils.permission.checkPermission('discussion-postToCategoryInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let _id = ObjectID(req.params.id);

  let discussionInfo = await dbTool.discussion.findOne({ _id: _id });
  // 检查discussion 是否已被封禁
  if (discussionInfo.status && discussionInfo.status.type === config.discussion.status.deleted) {
    return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
  }

  // 检查discussion 是否被锁定
  if (discussionInfo.status && discussionInfo.status.type === config.discussion.status.locked) {
    return errorHandler(null, errorMessages.DISCUSSION_LOCKED, 403, res);
  }

  if (!config.discussion.category.whiteList.includes(discussionInfo.category)
    // 鉴权 能否向所有分类新建跟帖
    && !await utils.permission.checkPermission('discussion-postToExtraCategory', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let now = Date.now();
  let emptyVote = {};
  for (let voteType of config.discussion.post.vote) emptyVote[voteType] = [];

  // 附件鉴权。是否为本人的附件。
  let _attachments = [];
  if (req.body.attachments) {
    _attachments = req.body.attachments.map(attachmentId => ObjectID(attachmentId));
  }
  if (!await isSelfAttachment(_attachments, req.member._id)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  };

  let postInfo = {
    attachments: _attachments,
    allowScript: req.member.role === 'admin',
    content: req.body.content,
    createDate: now,
    encoding: req.member.role === 'admin' ? req.body.encoding : 'markdown',
    status: {
      type: config.discussion.status.ok,
    },
    user: req.member._id,
    votes: emptyVote,
  };
  if (req.body.replyTo) {
    postInfo.replyTo = req.body.replyTo;
    postInfo.replyTo._memberId = ObjectID(postInfo.replyTo.memberId);
  }

  // 检索所有出现的 @
  // 提及的格式为出现在任意位置的 @ 并且后面紧接 24 个 HEX 字符
  const mentionPattern = /\@([0-9a-fA-F]{24})/g;
  postInfo.mentions = (postInfo.content.match(mentionPattern) || []).map(mention => mention.substr(1));
  let filterRepeat = new Set(postInfo.mentions);
  postInfo.mentions = Array.from(filterRepeat).map(mention => ObjectID(mention));

  // 追加一个 Post，同时更新一些元数据
  try {
    await dbTool.discussion.updateOne(
      { _id: _id },
      {
        $push: { posts: postInfo },
        $inc: { replies: 1 },
        $set: {
          lastMember: req.member._id,
          lastDate: new Date().getTime(),
        },
      }
    );

    // 动态生成楼层号
    let discussionInfo = await dbTool.discussion.findOne({
      _id: _id,
    });
    let postList = discussionInfo.posts;
    for (let i = postList.length - 1; i >= 0; i--) {
      if (postList[i].index === undefined) {
        let updateInfo = { $set: {} };
        updateInfo.$set[`posts.${i}.index`] = i + 1;
        await dbTool.discussion.update(
          { _id: _id },
          updateInfo
        );

        // 为返回结果添上楼层号
        // 筛选添加的楼层
        /* istanbul ignore else */
        if (postList[i].createDate === now && postList[i].user.equals(req.member._id)) {
          postInfo.index = i + 1;

          // 为附件绑定信息
          await dbTool.attachment.updateMany(
            { _id: { $in: _attachments } },
            {
              $push: {
                referer: {
                  _discussionId: _id,
                  index: postInfo.index,
                },
              },
            }
          );
        }
      } else break;
    }

    // 通知优先级: 屏蔽/讨论有跟帖/被回复/被at

    // 去重
    let needNotification = new Set();
    // 添加楼主
    needNotification.add(discussionInfo.creater.toString());
    // 添加被回复者
    if (postInfo.replyTo) needNotification.add(postInfo.replyTo.memberId);
    postInfo.mentions.forEach(mention => needNotification.add(mention));

    let watchList = await dbTool.commonMember.aggregate([
      { $match: { 'subscription.watch.discussions': discussionInfo._id } },
      { $project: { _id: true } },
    ]).toArray();

    watchList = watchList.map(member => member._id.toString());
    watchList.forEach(memberId => { needNotification.add(memberId); });

    needNotification = [...needNotification];
    // 如果已屏蔽则不发送通知
    let tempList = [];
    needNotification = needNotification.map(async memberId => {
      let _memberId = ObjectID(memberId);
      if (!await utils.member.isIgnored(_memberId, req.member._id)
        && !await utils.discussion.isIgnored(_memberId, discussionInfo._id)) {
        tempList.push(_memberId);
      }
    });
    await Promise.all(needNotification);
    needNotification = tempList;

    // 不给自己发送通知
    needNotification = needNotification.filter(memberId => !memberId.equals(req.member._id));

    needNotification.map(_memberId => {
      // 如果是楼主 则发送有跟帖通知
      if (_memberId.equals(discussionInfo.creater)) {
        return utils.notification.sendNotification(discussionInfo.creater, {
          content: utils.string.fillTemplate(config.notification.discussionReplied.content, {
            var1: req.member.username,
            var2: discussionInfo.title,
          }),
          href: utils.string.fillTemplate(config.notification.discussionReplied.href, {
            var1: discussionInfo._id,
            var2: Math.floor((postInfo.index - 1) / config.pagesize) + 1,
            var3: postInfo.index,
          }),
        });
      }

      // 如果是被回复者 则发送被回复通知
      if (postInfo.replyTo && _memberId.equals(postInfo.replyTo._memberId)) {
        return utils.notification.sendNotification(postInfo.replyTo._memberId, {
          content: utils.string.fillTemplate(config.notification.postReplied.content, {
            var1: req.member.username,
            var2: discussionInfo.title,
          }),
          href: utils.string.fillTemplate(config.notification.postReplied.href, {
            var1: discussionInfo._id,
            var2: Math.floor((postInfo.index - 1) / config.pagesize) + 1,
            var3: postInfo.index,
          }),
        });
      }

      // 如不是 watcher 则为被 at 的成员 发送被 at 的通知
      if (!watchList.includes(_memberId.toString())) {
        return utils.notification.sendNotification(_memberId, {
          content: utils.string.fillTemplate(config.notification.postMentioned.content, {
            var1: req.member.username,
            var2: discussionInfo.title,
          }),
          href: utils.string.fillTemplate(config.notification.discussionReplied.href, {
            var1: discussionInfo._id,
            var2: Math.floor((postInfo.index - 1) / config.pagesize) + 1,
            var3: postInfo.index,
          }),
        });
      }

      // 其余情况则通知 watcher
      return utils.notification.sendNotification(_memberId, {
        content: utils.string.fillTemplate(config.notification.postWatcher.content, {
          var1: req.member.username,
          var2: discussionInfo.title,
        }),
        href: utils.string.fillTemplate(config.notification.discussionReplied.href, {
          var1: discussionInfo._id,
          var2: Math.floor((postInfo.index - 1) / config.pagesize) + 1,
          var3: postInfo.index,
        }),
      });
    });

    let members = postInfo.mentions.map(_mention => {
      return utils.resolveMembers.fetchOneMember(_mention);
    });
    members = await Promise.all(members);

    await utils.logger.writeEventLog({
      entity: 'Post',
      type: 'Create',
      emitter: req.member._id,
      comments: {
        category: discussionInfo.category,
        discussion: _id,
      },
    });

    await utils.websocket.broadcastEvent('Post', 'Create', { discussionId: _id, category: discussionInfo.category, postIndex: postInfo.index });

    return res.status(201).send({ status: 'ok', newPost: postInfo, members: members });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let updatePost = async (req, res, next) => {
  let _id = ObjectID(req.params.id);
  let postIndex = req.params.postIndex;
  let now = Date.now();

  try {
    let exactPostRes = await dbTool.discussion.aggregate([
      { $match: { _id: _id } },
      { $unwind: '$posts' },
      { $match: { 'posts.index': postIndex } },
    ]).toArray();
    let exactPost = exactPostRes[0].posts;

    let canUpdateAnyPost = await utils.permission.checkPermission('discussion-updateAnyPost', req.member.permissions);
    let discussionInfo = await dbTool.discussion.findOne({ _id: _id });

    // 不可以编辑任意帖子，需要判断是否为创建者，以及这个讨论的状态
    /* istanbul ignore else */
    if (!canUpdateAnyPost) {
      /* istanbul ignore else */
      // 只有本人或管理员才可以修改 post
      if (exactPost.user.toString() !== req.member.id) {
        return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
      }

      /* istanbul ignore else */
      if (discussionInfo.status) {
        switch (discussionInfo.status.type) {
          case config.discussion.status.locked:
            return errorHandler(null, errorMessages.DISCUSSION_LOCKED, 403, res);
          case config.discussion.status.deleted:
            return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
        }
      }
    }

    let $set = {};
    if (req.body.content) $set[`posts.${postIndex - 1}.content`] = req.body.content;
    $set[`posts.${postIndex - 1}.updateDate`] = now;
    $set[`posts.${postIndex - 1}.encoding`] = 'markdown';
    /* istanbul ignore else */
    if (req.body.encoding === 'html'
      && await utils.permission.checkPermission('discussion-postHTML', req.member.permissions)) {
      $set[`posts.${postIndex - 1}.encoding`] = req.body.encoding;
    }

    // TODO: 修改回复人时重新发送通知
    // 修改replyTo
    if (req.body.replyTo) {
      req.body.replyTo.memberId = ObjectID(req.body.replyTo.memberId);
      $set[`posts.${postIndex - 1}.replyTo`] = req.body.replyTo;
    }

    // 看看需不需要修改讨论的标题和分区
    if (postIndex === 1 && req.body.meta) {
      if (req.body.meta.title) {
        $set.title = req.body.meta.title;
      }
      if (req.body.meta.category) {
        $set.category = req.body.meta.category;
      }
    }

    if (req.body.attachments) {
      let _attachments = req.body.attachments.map(attachmentId => ObjectID(attachmentId));
      if (!await isSelfAttachment(_attachments, req.member._id)) {
        return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
      };

      $set[`posts.${postIndex - 1}.attachments`] = _attachments;

      let isSame = (a, b) => {
        return a.toString() === b.toString();
      };

      // 移除不使用了的附件绑定
      let uselessAttachments = _.differenceWith(exactPost.attachments, _attachments, isSame);
      let newAttachments = _.differenceWith(_attachments, exactPost.attachments, isSame);

      // 为附件绑定信息
      await dbTool.attachment.updateMany(
        { _id: { $in: newAttachments } },
        {
          $push: {
            referer: {
              _discussionId: _id,
              index: postIndex,
            },
          },
        }
      );
      // 移除不使用了附件绑定
      await dbTool.attachment.updateMany(
        { _id: { $in: uselessAttachments } },
        {
          $pull: {
            referer: {
              _discussionId: _id,
              index: postIndex,
            },
          },
        }
      );
    }

    await dbTool.discussion.updateOne(
      { _id: _id },
      { $set: $set },
      { new: true }
    );

    utils.logger.writeEventLog({
      entity: 'Post',
      type: 'Update',
      emitter: req.member._id,
      comments: {
        category: exactPostRes[0].category,
        discussion: _id,
      },
    });

    utils.websocket.broadcastEvent('Post', 'Update', { discussionId: _id, category: exactPostRes[0].category, postIndex });

    return res.status(201).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let votePost = async (req, res, next) => {
  try {
    // 鉴权 是否可以投票
    if (!await utils.permission.checkPermission('discussion-voteToAllPost', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }
    let _discussionId = ObjectID(req.params.id);

    let discussionInfo = await dbTool.discussion.findOne({ _id: _discussionId });

    if (!discussionInfo) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }

    // 检查discussion 是否被锁定
    if (discussionInfo.status && discussionInfo.status.type === config.discussion.status.locked) {
      return errorHandler(null, errorMessages.DISCUSSION_LOCKED, 403, res);
    }

    let postInfo = await dbTool.discussion.aggregate([
      { $match: { _id: _discussionId } },
      { $unwind: '$posts' },
      { $match: { 'posts.index': req.params.postIndex } },
      { $project: { posts: 1 } },
    ]).toArray();
    // 检索 post 是否存在
    if (postInfo.length === 0) return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    // 检查discussion 是否已被封禁
    if (postInfo.baned) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }
    // 移除所有之前的已提交
    if (req.member._id) {
      let removeVoteInfo = { $pull: {} };
      removeVoteInfo.$pull[`posts.${req.params.postIndex - 1}.votes.${req.body.vote}`] = req.member._id;
      let removeDoc = await dbTool.discussion.updateOne(
        { _id: _discussionId },
        removeVoteInfo
      );

      // 如果之前存在提交，已抹除成功。
      if (removeDoc.modifiedCount === 1) {
        utils.logger.writeEventLog({
          entity: 'Post',
          type: 'RemoveVote',
          emitter: req.member._id,
          comments: {
            discussion: _discussionId,
          },
        });

        utils.websocket.broadcastEvent('Post', 'RemoveVote', { discussionId: _discussionId, category: postInfo.category, postIndex: req.params.postIndex });

        return res.status(201).send({ status: 'ok' });
      }
    }

    // 新增 vote
    let addVoteInfo = { $push: {}, $pull: {} };
    addVoteInfo.$push[`posts.${req.params.postIndex - 1}.votes.${req.body.vote}`] = req.member._id;
    // vote 的同时删除对立的选项
    addVoteInfo.$pull[`posts.${req.params.postIndex - 1}.votes.${req.body.vote === 'up' ? 'down' : 'up'}`] = req.member._id;
    await dbTool.discussion.updateOne(
      { _id: _discussionId },
      addVoteInfo
    );

    utils.logger.writeEventLog({
      entity: 'Post',
      type: 'AddVote',
      emitter: req.member._id,
      comments: {
        discussion: _discussionId,
      },
    });

    utils.websocket.broadcastEvent('Post', 'AddVote', { discussionId: _discussionId, category: postInfo.category, postIndex: req.params.postIndex });

    return res.status(201).send({ status: 'ok' });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.SERVER_ERROR, 500, res);
  }
};

/**
 * [处理函数] 查询指定成员创建的讨论
 * GET /api/v1/member/:id/discussions
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionUnderMember = async (req, res) => {
  // 鉴权 能否读取白名单分类中的讨论
  if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }

  let memberId = ObjectID(req.params.id);
  let { pagesize, page: offset } = req.query;
  offset -= 1;
  let query = {
    creater: memberId,
    category: { $in: config.discussion.category.whiteList },
    $or: [
      { status: null },
      { 'status.type': { $in: [config.discussion.status.ok, config.discussion.status.locked] } },
    ],
  };
  // 鉴权 能否读取所有分类的讨论
  if (await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
    delete query.category;
  }
  // 鉴权 能否获取被封禁的讨论
  if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
    delete query.$or;
  }
  try {
    // let cursor = dbTool.discussion.aggregate([
    //   { $match: query },
    //   {
    //     $project: {
    //       creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1,
    //       tags: 1, status: 1, lastMember: 1, replies: 1, category: 1
    //     }
    //   },
    //   { $sort: { createDate: -1 } },
    //   { $skip: offset * pagesize },
    //   { $limit: pagesize }
    // ]);
    let cursor = dbTool.discussion.find(
      query,
      {
        creater: 1, title: 1, createDate: 1, lastDate: 1, views: 1,
        tags: 1, status: 1, lastMember: 1, replies: 1, category: 1,
      }
    ).sort({ createDate: -1 }).limit(pagesize).skip(offset * pagesize);
    let discussions = await cursor.toArray();
    let count = await cursor.count();
    let members = await resolveMembersInDiscussionArray(discussions);
    return res.send({ status: 'ok', discussions, members, count });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 获得指定分区下的所有讨论
 * /api/v1/category/:slug/discussions
 * @param {Request} req
 * @param {Response} res
 */
let getDiscussionsByCategory = async (req, res, next) => {
  // 鉴权 能否读取白名单分类中的讨论
  if (!await utils.permission.checkPermission('discussion-readCategoriesInWhiteList', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  let pagesize = req.query.pagesize;
  let offset = req.query.page - 1;

  try {
    let category = await slugToCategory(req.params.slug);
    /* istanbul ignore if */
    if (typeof category === 'undefined') {
      if (!await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
        return res.status(200).send({ status: 'ok' });
      } else {
        category = req.params.slug;
      }
    }

    let query = {
      category: category,
      $or: [
        { status: null },
        { 'status.type': { $in: [config.discussion.status.ok] } },
      ],
    };
    if (!config.discussion.category.whiteList.includes(category)
      // 鉴权 能否读取所有分类的讨论
      && !await utils.permission.checkPermission('discussion-readExtraCategories', req.member.permissions)) {
      return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
    }
    // 鉴权 能否获取被封禁的讨论
    if (await utils.permission.checkPermission('discussion-readBanedPost', req.member.permissions)) {
      delete query.$or;
    }

    let discussions = await dbTool.discussion.aggregate([
      { $match: query },
      {
        $project: {
          creater: 1, title: 1, createDate: 1, lastDate: 1,
          views: 1, tags: 1, status: 1, lastMember: 1, replies: 1,
        },
      },
      { $sort: { lastDate: -1 } },
      { $skip: offset * pagesize },
      { $limit: pagesize },
    ]).toArray();

    let members = await resolveMembersInDiscussionArray(discussions);
    return res.send({ status: 'ok', discussions: discussions, members: members });
  } catch (err) {
    /* istanbul ignore next */
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 封禁/解封 一个 Post
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let deletePost = async (req, res, next) => {
  // 鉴权 是否可以 封禁/解封 Post
  if (!await utils.permission.checkPermission('discussion-ban', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  try {
    let _id = ObjectID(req.params.id);
    let postIndex = req.params.postIndex;

    // 查询封禁状态
    let postsDoc = await dbTool.discussion.aggregate([
      { $match: { _id: _id } },
      { $unwind: '$posts' },
    ]).toArray();

    let status = {
      type: config.discussion.status.deleted,
      operator: req.member._id,
      time: Date.now(),
    };

    // 如果已封禁则解除封禁
    let isDeleted = postsDoc[postIndex - 1].posts.status && postsDoc[postIndex - 1].posts.status.type === config.discussion.status.deleted;
    if (isDeleted) {
      status = {
        type: config.discussion.status.ok,
        operator: req.member._id,
        time: Date.now(),
      };
    }

    let updateDate = { $set: {} };
    updateDate.$set[`posts.${postIndex - 1}.status`] = status;
    postsDoc[postIndex - 1].posts.status = status;

    // 我们还需要顺便更新了最后回复用户和最后回复日期，只要从最后一个 post
    // 往前数，找到第一个状态正常的帖子即可
    const lastValidPost = postsDoc.filter(post => post.posts.status.type === config.discussion.status.ok).reverse()[0] || postsDoc[0];
    updateDate.$set.lastDate = lastValidPost.posts.createDate;
    updateDate.$set.lastMember = lastValidPost.posts.user;

    await dbTool.discussion.findOneAndUpdate(
      { _id: _id },
      updateDate,
      { returnOriginal: false }
    );

    const title = postsDoc[postIndex - 1].title;
    const content = postsDoc[postIndex - 1].posts.content;
    const href = utils.string.fillTemplate(config.notification.postRecover.href, {
      var1: _id,
      var2: Math.floor((postIndex - 1) / config.pagesize) + 1,
      var3: postIndex,
    });

    let notification;

    if (isDeleted) {
      notification = {
        content: utils.string.fillTemplate(config.notification.postRecover.content, { title, content }),
        href,
      };
    } else {
      notification = {
        content: utils.string.fillTemplate(config.notification.postDeleted.content, { title, content }),
        href,
      };
    }

    utils.notification.sendNotification(postsDoc[postIndex - 1].posts.user, notification);

    return res.status(204).send({ status: 'ok' });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

/**
 * [处理函数] 封禁/解封 一个 Discussion
 *
 * @param {any} req
 * @param {any} res
 * @param {any} next
 * @returns
 */
let deleteDiscussion = async (req, res, next) => {
  // 鉴权 是否可以 封禁/解封 Discussion
  if (!await utils.permission.checkPermission('discussion-ban', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  try {
    let _id = ObjectID(req.params.id);

    // 查询封禁状态
    let discussionDoc = await dbTool.discussion.aggregate([
      { $match: { _id: _id } },
      { $project: { title: 1, creater: 1 } },
    ]).toArray();

    if (req.query.force) {
      if (discussionDoc) {
        let notification = {
          content: utils.string.fillTemplate(
            config.notification.discussionDeleted.content,
            { title: discussionDoc[0].title }
          ),
        };
        await Promise.all([
          utils.notification.sendNotification(discussionDoc[0].creater, notification),
          dbTool.discussion.deleteOne({ _id: _id }),
        ]);
        return res.status(204).send({ status: 'ok' });
      } else {
        return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
      }
    }

    // 如果封禁则记录管理员信息和封禁时间
    let status = {
      type: config.discussion.status.deleted,
      operator: req.member._id,
      time: Date.now(),
    };
    // 如果已封禁则解除封禁
    let isDeleted = discussionDoc[0].status && discussionDoc[0].status.type === config.discussion.status.deleted;
    if (isDeleted) {
      status = {
        type: config.discussion.status.ok,
        operator: req.member._id,
        time: Date.now(),
      };
    }
    let updateDate = { $set: {} };
    updateDate.$set.status = status;

    let updateDoc = await dbTool.discussion.findOneAndUpdate(
      { _id: _id },
      updateDate,
      { returnOriginal: false }
    );
    // TODO: 为通知添加跳转链接（被封禁的 discussion 要不要对发布者开放？）
    let notification = {
      content: isDeleted
        ? utils.string.fillTemplate(
          config.notification.discussionRecover.content,
          { title: updateDoc.value.title }
        )
        : utils.string.fillTemplate(
          config.notification.discussionDeleted.content,
          { title: updateDoc.value.title }
        ),
    };
    utils.notification.sendNotification(updateDoc.value.creater, notification);
    return res.status(204).send({ status: 'ok' });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

let ignoreDiscussion = async (req, res, next) => {
  await utils.discussion.setIgnore(req.member._id, ObjectID(req.params.id));

  return res.status(201).send({ status: 'ok' });
};

let watchDiscussion = async (req, res, next) => {
  await dbTool.commonMember.updateOne(
    { _id: req.member._id },
    {
      $push: { 'subscription.watch.discussions': ObjectID(req.params.id) },
      $pull: { 'subscription.ignore.discussions': ObjectID(req.params.id) },
    }
  );
  return res.status(201).send({ status: 'ok' });
};

let normalDiscussion = async (req, res, next) => {
  await dbTool.commonMember.updateOne(
    { _id: req.member._id },
    {
      $pull: {
        'subscription.watch.discussions': ObjectID(req.params.id),
        'subscription.ignore.discussions': ObjectID(req.params.id),
      },
    }
  );
  return res.status(201).send({ status: 'ok' });
};

let ignoreMember = async (req, res, next) => {
  await utils.member.setIgnore(req.member._id, ObjectID(req.params.id));

  return res.status(201).send({ status: 'ok' });
};

let lockDiscussion = async (req, res, next) => {
  if (!await utils.permission.checkPermission('discussion-lockDiscussion', req.member.permissions)) {
    return errorHandler(null, errorMessages.PERMISSION_DENIED, 401, res);
  }
  try {
    let _id = ObjectID(req.params.id);

    // 查询锁定状态
    let discussionDoc = await dbTool.discussion.aggregate([
      { $match: { _id: _id } },
      { $project: { title: 1, creater: 1, status: 1 } },
    ]).toArray();

    if (!discussionDoc) {
      return errorHandler(null, errorMessages.NOT_FOUND, 404, res);
    }

    // 如果锁定则记录管理员信息和锁定时间
    let status = {
      type: config.discussion.status.locked,
      operator: req.member._id,
      time: Date.now(),
    };

    // 如果已锁定则解除锁定
    let isLocked = discussionDoc[0].status && discussionDoc[0].status.type === config.discussion.status.locked;
    if (isLocked) {
      status = {
        type: config.discussion.status.ok,
        operator: req.member._id,
        time: Date.now(),
      };
    }
    let updateDate = { $set: {} };
    updateDate.$set.status = status;

    let updateDoc = await dbTool.discussion.findOneAndUpdate(
      { _id: _id },
      updateDate,
      { returnOriginal: false }
    );

    const title = updateDoc.value.title;
    const href = utils.string.fillTemplate(config.notification.postRecover.href, {
      var1: _id,
      var2: Math.floor((updateDoc.value.index - 1) / config.pagesize) + 1,
      var3: updateDoc.value.index,
    });

    let notification;

    if (isLocked) {
      notification = {
        content: utils.string.fillTemplate(config.notification.discussionRecover.content, { title }),
        href,
      };
    } else {
      notification = {
        content: utils.string.fillTemplate(config.notification.discussionLocked.content, { title }),
        href,
      };
    }

    utils.notification.sendNotification(updateDoc.value.creater, notification);
    return res.status(204).send({ status: 'ok' });
  } catch (err) {
    return errorHandler(err, errorMessages.DB_ERROR, 500, res);
  }
};

module.exports = {
  createDiscussion,
  createPost,
  deleteDiscussion,
  deletePost,
  getDiscussionById,
  getDiscussionPostsById,
  getDiscussionsByCategory,
  getDiscussionUnderMember,
  getLatestDiscussionList,
  getPostByIndex,
  ignoreDiscussion,
  ignoreMember,
  lockDiscussion,
  normalDiscussion,
  updatePost,
  votePost,
  watchDiscussion,
};
