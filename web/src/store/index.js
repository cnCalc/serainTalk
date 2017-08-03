/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './mutations';
import actions from './actions';

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
    discussionMeta: {},
    discussionPosts: {},
  },
  mutations,
  actions,
});
