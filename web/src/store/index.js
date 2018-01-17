/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './mutations';
import actions from './actions';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    members: {},
    member: {
      discussions: [],
    },
    me: {},
    discussions: [],
    categoriesGroup: [],
    globalTitle: {
      title: '',
      subtitle: '',
      isMobileMemberView: false,
    },
    theme: window.localStorage['theme'] || 'light',
    busy: false,
    discussionMeta: {},
    discussionPosts: {},
    editor: {
      mode: 'CREATE_DISCUSSION',
      discussionId: null,
      memberId: null,
      display: 'none',
      index: 0,
    },
    notifications: {},
    autoLoadOnScroll: window.localStorage['experimental-auto-load-on-scroll'] === 'on',
  },
  mutations,
  actions,
});

export default store;
