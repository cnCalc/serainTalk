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
      title, subtitle, isMobileMemberView,
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
   * 合并 member 对象
   */
  mergeMembers: (state, members) => {
    state.members = Object.assign(state.members, members);
  },

  /**
   * 变更繁忙状态
   */
  setBusy: (state, isBusy) => {
    state.busy = isBusy;
  },

  /** 设置帖子元数据 */
  setDiscussionMeta: (state, meta) => {
    state.discussionMeta = meta;
  },

  /** 设置帖子内容 */
  setDiscussionPosts: (state, posts) => {
    state.discussionPosts = [];
    posts.forEach(post => {
      state.discussionPosts[post.index] = post;
    });
  },

  /** 更新帖子内容 */
  updateDiscussionPosts: (state, posts) => {
    posts.forEach(post => {
      state.discussionPosts[post.index] = post;
    });
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
    state.member.discussions = discussions;
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
  updateEditorMode: (state, { mode, discussionId, discussionTitle, memberId, index }) => {
    state.editor.mode = mode;
    state.editor.discussionId = discussionId;
    state.editor.discussionTitle = discussionTitle;
    state.editor.memberId = memberId;
    state.editor.index = index;
  },

  /**
   * 更新通知列表
   */
  setNotifications: (state, { notifications, count }) => {
    state.notifications = {
      list: notifications,
      count,
      new: !notifications.reduce((a, b) => a && b.hasRead, true)
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
  }
};

export default mutations;
