function filterPosts (posts) {
  posts.forEach(post => {
    post.attachments = post.attachments.filter(attachmentId => !(new RegExp(attachmentId, 'i').test(post.content)));
  });
}

let mutations = {
  /**
   * 设置帖子列表页面左侧的板块和分组
   */
  setCategoriesGroup: (state, newCategoriesGroup) => {
    state.categoriesGroup = newCategoriesGroup;
  },

  /**
   * 设置页面巨幕的标题和副标题
   */
  setGlobalTitles: (state, [title, subtitle, isMobileMemberView]) => {
    state.globalTitle = {
      title, subtitle,
      isMobileMemberView: isMobileMemberView || false,
    };
  },

  /**
   * 变更主题
   */
  switchTheme: state => {
    state.theme = window.localStorage['theme'] = (state.theme === 'dark' ? 'light' : 'dark');
  },

  /**
   * 设置帖子列表正在展示的帖子
   */
  setDiscussions: (state, discussions) => {
    state.discussions = discussions;
  },

  /**
   * 向帖子列表内附加帖子
   */
  appendDiscussions: (state, discussions) => {
    state.discussions = [...state.discussions, ...discussions];
  },

  /**
   * TODO
   */
  setCategoryDiscussions: (state, { category, discussions }) => {
    state.category = {
      categoryName: category,
      discussions,
    };

    if (process.env.VUE_ENV === 'server') {
      state.globalTitle = {
        title: category,
        isMobileMemberView: state.globalTitle.isMobileMemberView,
      };
      state.categoriesGroup.forEach(cat => {
        cat.items.forEach(item => {
          if (item.name === category) {
            state.globalTitle.subtitle = item.description;
          }
        });
      });
    }
  },

  /**
   * TODO
   */
  appendCategoryDiscussions: (state, discussions) => {
    state.category.discussions = [...state.category.discussions, ...discussions];
  },

  /**
   * 合并 member 对象
   */
  mergeMembers: (state, members) => {
    state.members = Object.assign(state.members, members);
  },

  /**
   * 合并 attachment 对象
   */
  mergeAttachments: (state, attachments) => {
    state.attachments = Object.assign(state.attachments, attachments);
  },

  /**
   * 变更繁忙状态
   */
  setBusy: (state, isBusy) => {
    if (isBusy || process.env.VUE_ENV === 'server') {
      state.busy = isBusy;
    } else {
      setTimeout(() => {
        state.busy = isBusy;
      }, 0);
    }
  },

  /**
   * 更新设置
   */
  setSettings: (state, settings) => {
    state.settings = settings;
  },

  /** 设置帖子元数据 */
  setDiscussionMeta: (state, meta) => {
    state.discussionMeta = meta.discussionInfo;
    state.discussionMeta.postsCount = meta.count;
    if (process.env.VUE_ENV === 'server') {
      state.globalTitle = {
        title: meta.discussionInfo.title,
        subtitle: meta.discussionInfo.category,
        isMobileMemberView: state.globalTitle.isMobileMemberView,
      };
    }
  },

  /** 设置帖子内容 */
  setDiscussionPosts: (state, posts) => {
    filterPosts(posts);
    state.discussionPosts = [];
    posts.forEach(post => {
      state.discussionPosts[post.index] = post;
    });
  },

  /** 更新帖子内容 */
  updateDiscussionPosts: (state, posts) => {
    filterPosts(posts);
    posts.forEach(post => {
      state.discussionPosts[post.index] = post;
    });
    state.discussionPosts = state.discussionPosts.map(el => el);
  },

  /** 清空帖子内容 */
  clearDiscussionPosts: (state, posts) => {
    state.discussionPosts = [];
  },

  /** 设置用户信息 */
  setMember: (state, memberInfo) => {
    state.member = memberInfo;
  },

  appendMemberRecentActivity: (state, aciticities) => {
    state.member.recentActivities.push(...aciticities);
  },

  /**
   * 设置帖子列表正在展示的帖子
   */
  setMemberDiscussions: (state, discussions) => {
    state.member = Object.assign(state.member, { discussions });
  },

  /**
   * 向帖子列表内附加帖子
   */
  appendMemberDiscussions: (state, discussions) => {
    state.member.discussions = [...state.member.discussions, ...discussions];
  },

  /**
   * 更新当前登陆的用户细心
   */
  setCurrentSigninedMemberInfo: (state, me) => {
    state.me = me;
  },

  /**
   * 修改编辑器的显示模式
   */
  updateEditorDisplay: (state, display) => {
    state.editor.display = display;
  },

  /**
   * 修改编辑器的模式
   */
  updateEditorMode: (state, { mode, discussionId, discussionTitle, discussionCategory, memberId, index }) => {
    let payload = { mode, discussionId, discussionTitle, discussionCategory, memberId, index };
    state.editor = Object.assign(state.editor, payload);
  },

  /**
   * 更新通知列表
   */
  setNotifications: (state, { notifications, count }) => {
    state.notifications = {
      list: notifications,
      count,
      new: !notifications.reduce((a, b) => a && b.hasRead, true),
    };
  },

  /**
   * 更新某一个通知（标记为已读）
   */
  updateNofitication: (state, { index }) => {
    const item = state.notifications.list.filter(item => item.index === index)[0];
    if (item) {
      item.hasRead = true;
      state.notifications.new = !state.notifications.list.reduce((a, b) => a && b.hasRead, true);
    }
  },

  updateMessageBox: (state, params) => {
    if (params.promise) {
      state.messageBox = params;
    } else {
      state.messageBox = Object.assign(state.messageBox, params);
    }
  },

  disposeMessageBox: (state) => {
    state.messageBox = {
      promise: null,
      title: state.messageBox.title,
      message: state.messageBox.message,
    };
  },

  updateMessageSession: (state, messageId) => {
    state.messageSession = messageId;
  },

  switchScrollBehavior: state => {
    state.autoLoadOnScroll = !state.autoLoadOnScroll;
    window.localStorage['experimental-auto-load-on-scroll'] = state.autoLoadOnScroll ? 'on' : 'off';
  },
};

export default mutations;
