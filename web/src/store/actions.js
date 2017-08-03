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
  fetchLatestDiscussions: (state, param = {}) => {
    state.commit('setBusy', true);
    param.append || state.commit('setDiscussions', []);
    return api.v1.discussion.fetchLatestDiscussions(param).then(data => {
      state.commit('mergeMembers', data.members);
      if (param.append) {
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
  fetchDiscussionsUnderCategory: (state, param = {}) => {
    state.commit('setBusy', true);
    param.append || state.commit('setDiscussions', []);
    return api.v1.category.fetchDiscussionsUnderCategory(param).then(data => {
      state.commit('mergeMembers', data.members);
      if (param.append) {
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
  fetchDiscussion: (state, param = {}) => {
    state.commit('setBusy', true);
    state.commit('clearDiscussionPosts');
    return api.v1.discussion.fetchDiscussionMetaById(param).then(data => {
      state.commit('setDiscussionMeta', data);
      return api.v1.discussion.fetchDiscussionPostsById(param);
    }).then(data => {
      state.commit('mergeMembers', data.members);
      state.commit('setDiscussionPosts', data.posts);
      state.commit('setBusy', false);
    });
  },

  /**
   * 获得指定讨论的元数据
   */
  fetchDiscussionsMeta: (state, param = {}) => {
    state.commit('setBusy', true);
    return api.v1.discussion.fetchDiscussionMetaById(param).then(data => {
      state.commit('setDiscussionMeta', data);
    });
  },

  /**
   * 获取某个讨论的指定页内容
   */
  fetchDiscussionPosts: (state, param = {}) => {
    state.commit('setBusy', true);
    return api.v1.discussion.fetchDiscussionMetaById(param).then(data => {
      state.commit('setDiscussionMeta', data);
      return api.v1.discussion.fetchDiscussionPostsById(param);
    }).then(data => {
      state.commit('mergeMembers', data.members);
      if (param.overwrite) {
        state.commit('setDiscussionPosts', data.posts);
      } else {
        state.commit('updateDiscussionPosts', data.posts);
      }
      state.commit('setBusy', false);
    });
  },

};