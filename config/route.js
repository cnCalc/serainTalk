'use strict';

const dataInterface = require('../app/dataInterface');
const handlers = require('../app/handlers');

let permissions = require('./permissions.json');

let route = {
  discussion: {
    get: {
      latest: {
        description: '获取最新的讨论。',
        path: [
          '/v1/discussions/latest',
          '/v1/discussion/latest'
        ],
        schema: dataInterface.discussion.getLatestList,
        handler: handlers.v1.discussion.getLatestDiscussionList
      },
      byDiscussionId: {
        description: '根据讨论 ID 获取讨论摘要。',
        path: [
          '/v1/discussions/:id',
          '/v1/discussion/:id'
        ],
        schema: dataInterface.discussion.getDiscussion,
        handler: handlers.v1.discussion.getDiscussionById
      }
    },
    post: {
      addOne: {
        description: '新发布一个 Discussion。',
        path: [
          '/v1/discussions',
          '/v1/discussion',
        ],
        schema: dataInterface.discussion.createDiscussion,
        handler: handlers.v1.discussion.createDiscussion
      }
    }
  },
  posts: {
    get: {
      byDiscussionId: {
        description: '获取指定 Discussion 下的所有 Post。',
        path: [
          '/v1/discussions/:id/posts',
          '/v1/discussion/:id/posts'
        ],
        schema: dataInterface.discussion.getPostsById,
        handler: handlers.v1.discussion.getDiscussionPostsById
      }
    },
    post: {
      addOne: {
        description: '在指定 Discussion 下追加一个 Post。',
        path: [
          '/v1/discussions/:id/post',
          '/v1/discussion/:id/post'
        ],
        schema: dataInterface.discussion.createPost,
        handler: handlers.v1.discussion.createPost
      }
    },
    put: {
      updateOne: {
        description: '修改指定 Discussion 下指定楼层的 Post。',
        path: [
          '/v1/discussions/:id/post/:postIndex',
          '/v1/discussion/:id/post/:postIndex'
        ],
        schema: dataInterface.discussion.updatePost,
        handler: handlers.v1.discussion.updatePost
      }
    }
  },
  vote: {
    post: {
      addOne: {
        description: '为指定 Post 添加一个 vote。',
        path: [
          '/v1/discussions/:id/post/:postIndex',
          '/v1/discussion/:id/post/:postIndex'
        ],
        schema: dataInterface.discussion.updatePost,
        handler: handlers.v1.discussion.updatePost
      }
    }
  },
  member: {
    get: {
      self: {
        description: '获取自己的信息。',
        path: [
          '/v1/members/:id/post/:postIndex',
          '/v1/member/:id/post/:postIndex'
        ],
        schema: dataInterface.discussion.updatePost,
        handler: handlers.v1.discussion.updatePost
      }
    }
  }
};
