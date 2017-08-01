/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';
import api from '../api';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    members: {},
    discussions: [],
    categoriesGroup: [],
    globalTitle: '',
    globalSubtitle: '',
    theme: window.localStorage['theme'] || 'light',
    busy: false,
  },
  mutations: {
    setCategoriesGroup: (state, newCategoriesGroup) => state.categoriesGroup = newCategoriesGroup,
    setGlobalTitles: (state, [title, subtitle]) => {
      state.globalTitle = title || '';
      state.globalSubtitle = subtitle || '';
    },
    switchTheme: state => state.theme = window.localStorage['theme'] = (state.theme === 'dark' ? 'light' : 'dark'),
    setDiscussions: (state, discussions) => state.discussions = discussions,
    appendDiscussions: (state, discussions) => state.discussions = [...state.discussions, ...discussions],
    mergeMembers: (state, members) => state.members = Object.assign(state.members, members),
    setBusy: (state, isBusy) => state.busy = isBusy,
  },
  actions: {
    fetchCategory: state => {
      return api.v1.category.fetchCategoryList().then(categoryList => {
        state.commit('setCategoriesGroup', categoryList);
      });
    },
    fetchLatestDiscussions: (state, param = {}) => {
      state.commit('setBusy', true);
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
    fetchDiscussionsUnderCategory: (state, param = {}) => {
      state.commit('setBusy', true);
      return api.v1.category.fetchDiscussionsUnderCategory(param).then(data => {
        state.commit('mergeMembers', data.members);
        if (param.append) {
          state.commit('appendDiscussions', data.discussions);
        } else {
          state.commit('setDiscussions', data.discussions);
        }
        state.commit('setBusy', false);
      });
    }
  }
});
