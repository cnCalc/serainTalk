import api from '../api';

export default {
  /**
   * 获取帖子分组和板块
   */
  fetchCategory: state => {
    return api.v1.category.fetchCategoryList().then(categoryList => {
      state.commit('setCategoriesGroup', categoryList);
    });
  },

  /**
   * 获取全站最近的讨论（首页）
   */
  fetchLatestDiscussions: (state, params = {}) => {
    state.commit('setBusy', true);
    params.append || state.commit('setDiscussions', []);
    return api.v1.discussion.fetchLatestDiscussions(params).then(data => {
      state.commit('mergeMembers', data.members);
      if (params.append) {
        state.commit('appendDiscussions', data.discussions);
      } else {
        state.commit('setDiscussions', data.discussions);
      }
      state.commit('setBusy', false);
    });
  },

  /**
   * 获取某个分区下最近的讨论（分区首页）
   */
  fetchDiscussionsUnderCategory: (state, params = {}) => {
    state.commit('setBusy', true);
    params.append || state.commit('setDiscussions', []);
    return api.v1.category.fetchDiscussionsUnderCategory(params).then(data => {
      state.commit('mergeMembers', data.members);
      if (params.append) {
        state.commit('appendDiscussions', data.discussions);
      } else {
        state.commit('setDiscussions', data.discussions);
      }
      state.commit('setBusy', false);
    });
  },

  /**
   * FIXME: change function name.
   * 获取某个讨论的元数据以及指定页的内容，用于首屏渲染
   */
  fetchDiscussion: (state, params = {}) => {
    state.commit('setBusy', true);
    state.commit('clearDiscussionPosts');
    return api.v1.discussion.fetchDiscussionMetaById(params).then(data => {
      state.commit('setDiscussionMeta', data);
      return api.v1.discussion.fetchDiscussionPostsById(params);
    }).then(data => {
      state.commit('mergeMembers', data.members);
      state.commit('mergeAttachments', data.attachments);
      state.commit('updateDiscussionPosts', data.posts);

      if (params.preloadPrevPage && params.page !== 1) {
        params.page--;
        return api.v1.discussion.fetchDiscussionPostsById(params);
      }
      return Promise.resolve();
    }).then(data => {
      if (data) {
        state.commit('mergeMembers', data.members);
        state.commit('mergeAttachments', data.attachments);
        state.commit('updateDiscussionPosts', data.posts);
      }
    }).finally(() => {
      state.commit('setBusy', false);
    });
  },

  /**
   * 获得指定讨论的元数据
   */
  fetchDiscussionsMeta: (state, params = {}) => {
    return api.v1.discussion.fetchDiscussionMetaById(params).then(data => {
      state.commit('setDiscussionMeta', data);
    });
  },

  /**
   * 获取某个讨论的指定页内容
   */
  fetchDiscussionPosts: (state, params = {}) => {
    params.quiet || state.commit('setBusy', true);
    return api.v1.discussion.fetchDiscussionMetaById(params).then(data => {
      state.commit('setDiscussionMeta', data);
      return api.v1.discussion.fetchDiscussionPostsById(params);
    }).then(data => {
      state.commit('mergeMembers', data.members);
      state.commit('mergeAttachments', data.attachments);
      if (params.overwrite) {
        state.commit('setDiscussionPosts', data.posts);
      } else {
        state.commit('updateDiscussionPosts', data.posts);
      }
      params.quiet || state.commit('setBusy', false);
    });
  },

  /**
   * 更新单个楼层的信息，在点赞、编辑等之后使用
   */
  updateSingleDiscussionPost: (state, params = {}) => {
    return api.v1.discussion.fetchDiscussionPostByIdAndIndex(params).then(data => {
      state.commit('updateDiscussionPosts', [data.post]);
    });
  },

  /**
   * 获取成员用户的信息
   */
  fetchMemberInfo: (state, params = {}) => {
    state.commit('setBusy', true);
    state.commit('setMember', {});
    return api.v1.member.fetchMemberInfoById(params).then(data => {
      state.commit('setMember', data.member);
      state.commit('mergeMembers', data.members);
      state.commit('setBusy', false);
    });
  },

  /**
   * 获取用户创建的讨论列表
   */
  fetchDiscussionsCreatedByMember: (state, params = {}) => {
    state.commit('setBusy', true);
    params.append || state.commit('setMemberDiscussions', []);
    return api.v1.member.fetchDiscussionsCreatedByMember(params).then(data => {
      if (params.append) {
        state.commit('appendMemberDiscussions', data.discussions);
      } else {
        state.commit('setMemberDiscussions', data.discussions);
      }
      state.commit('mergeMembers', data.members);
      state.commit('setBusy', false);
      return Promise.resolve(data.count);
    });
  },

  /**
   * 获取当前用户信息（仅根组件创建、即首次打开时）
   */
  fetchCurrentSigninedMemberInfo: state => {
    return api.v1.member.fetchMe({}).then(data => {
      state.commit('setCurrentSigninedMemberInfo', data.memberInfo);
      state.commit('setSettings', data.memberInfo.settings || {});
    });
  },

  /**
   * 获取当前用户通知
   */
  fetchNotifications: (state, params = {}) => {
    return api.v1.notification.fetchNotification(params).then(data => {
      const { notifications, count } = data;
      state.commit('setNotifications', { notifications, count });
    });
  },

  /**
   * 将某个通知标记为已读
   */
  readNotification: (state, params = {}) => {
    return api.v1.notification.readNotification(params).then(data => {
      state.commit('updateNofitication', params);
    });
  },

  showMessageBox: (state, { type, title, message, html }) => {
    let resolve, reject;
    const p = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    p.resolve = resolve;
    p.reject = reject;

    state.commit('updateMessageBox', { type, title, message, promise: p, html });

    return p;
  },

  updateMessageBox: (state, { title, message }) => {
    state.commit('updateMessageBox', { title, message });
  },

  disposeMessageBox: (state) => {
    state.commit('disposeMessageBox', { promise: null });
  },

  updateSetting: (state, { key, value }) => {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, 300 + 300 * Math.random());
    }).then(() => {
      api.v1.member.updateSetting({ key, value }).then(() => {
        return state.dispatch('fetchCurrentSigninedMemberInfo');
      });
    });
  },
};
